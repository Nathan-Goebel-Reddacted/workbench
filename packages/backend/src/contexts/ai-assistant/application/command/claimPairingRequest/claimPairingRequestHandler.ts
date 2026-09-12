import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { ClaimOutcome, ClaimPairingRequestCommand } from './claimPairingRequestCommand';
import { IPairingRequestRepository } from '../../../domain/repository/iPairingRequestRepository';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { ISecretHasher } from '../../../domain/port/iSecretHasher';
import { PairingRequest } from '../../../domain/pairingRequestAggregate';
import { PairingCode, normalizePairingCode } from '../../../domain/valueObject/pairingCode';
import { PairingStatusValue } from '../../../domain/valueObject/pairingStatus';
import { Token } from '../../../domain/valueObject/token';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { issueAgentToken } from '../../auth/agentToken';
import { ITransactionRunner } from '@shared/application/port/iTransactionRunner';

export class ClaimPairingRequestHandler implements ICommandHandler<ClaimPairingRequestCommand, ClaimOutcome> {
    constructor(
        private readonly requests: IPairingRequestRepository,
        private readonly agentTools: IAgentToolRepository,
        private readonly hasher: ISecretHasher,
        private readonly transaction: ITransactionRunner,
    ) {}

    async handle(command: ClaimPairingRequestCommand): Promise<ClaimOutcome> {
        const code = normalizePairingCode(command.code);
        const request = await this.resolve(code);

        if (!request || request.isExpired()) return { status: 'unknown' };
        if (request.isPending()) return { status: 'pending' };
        if (request.getStatus() !== PairingStatusValue.APPROVED) return { status: 'unknown' };

        const agentToolId = request.claim();
        const agentTool = await this.agentTools.findById(agentToolId);
        if (!agentTool) throw new NotFoundError('AgentTool', agentToolId.getValue());

        // Le secret est frappé ici, au seul moment où il peut atteindre l'agent.
        const { secret, token } = issueAgentToken(agentToolId.getValue());
        agentTool.rotateToken(new Token(await this.hasher.hash(secret)));

        // Frapper le jeton et consommer la demande ne font qu'un. Séparées, une panne entre
        // elles rendait à l'agent un jeton que la base n'avait pas enregistré, ou laissait la
        // demande réclamable une seconde fois avec un jeton déjà rendu.
        await this.transaction.run(async () => {
            await this.agentTools.save(agentTool);
            await this.requests.save(request);
        });

        return { status: 'approved', token };
    }

    /** Le préfixe ramène une poignée de lignes, l'empreinte désigne la bonne. */
    private async resolve(code: string): Promise<PairingRequest | null> {
        const candidates = await this.requests.findByCodePrefix(PairingCode.prefixOf(code));

        for (const candidate of candidates) {
            if (await this.hasher.matches(code, candidate.getCode().getDigest())) return candidate;
        }
        return null;
    }
}
