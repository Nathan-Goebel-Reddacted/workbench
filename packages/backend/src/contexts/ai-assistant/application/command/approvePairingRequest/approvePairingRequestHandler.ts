import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { ApprovalOutcome, ApprovePairingRequestCommand } from './approvePairingRequestCommand';
import { IPairingRequestRepository } from '../../../domain/repository/iPairingRequestRepository';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { AgentToolFactory } from '../../../domain/factory/agentToolFactory';
import { AgentToolId } from '../../../domain/valueObject/agentToolId';
import { issueAgentToken } from '../../auth/agentToken';
import { ITransactionRunner } from '@shared/application/port/iTransactionRunner';
import { PairingRequestId } from '../../../domain/valueObject/pairingRequestId';

export class ApprovePairingRequestHandler
    implements ICommandHandler<ApprovePairingRequestCommand, ApprovalOutcome | null>
{
    constructor(
        private readonly requests: IPairingRequestRepository,
        private readonly agentTools: IAgentToolRepository,
        private readonly agentToolFactory: AgentToolFactory,
        private readonly transaction: ITransactionRunner,
    ) {}

    /** Rend `null` quand la demande n'existe pas : à l'appelant de dire ce que cela vaut. */
    async handle(command: ApprovePairingRequestCommand): Promise<ApprovalOutcome | null> {
        const request = await this.requests.findById(new PairingRequestId(command.id));
        if (!request) return null;
        if (!request.isPending()) return { outcome: 'alreadyDecided', status: request.getStatus() };

        const scopes = command.scopes ?? request.getRequestedScopes().map(scope => scope.getValue());
        const permission = command.permission ?? request.getRequestedPermission().getValue();

        const agentToolId = new AgentToolId();
        // Un secret jetable : le vrai est frappé quand l'agent vient le réclamer.
        const { secret } = issueAgentToken(agentToolId.getValue());
        const agentTool = await this.agentToolFactory.create(
            agentToolId.getValue(),
            command.userId,
            request.getName().getValue(),
            permission,
            scopes,
            secret,
        );
        request.approve(agentToolId);

        // Les deux écritures sont solidaires. Séparées, un incident entre elles laissait un
        // outil orphelin — porteur d'un secret que personne n'a reçu — pendant que la demande
        // restait en attente : la réapprouver en fabriquait simplement un second.
        await this.transaction.run(async () => {
            await this.agentTools.save(agentTool);
            await this.requests.save(request);
        });

        return { outcome: 'approved', agentToolId: agentToolId.getValue(), scopes, permission };
    }
}
