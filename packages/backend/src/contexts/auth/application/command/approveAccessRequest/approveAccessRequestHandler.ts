import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { ApproveAccessRequestCommand } from './approveAccessRequestCommand';
import { IAccessRequestRepository } from '../../../domain/repository/iAccessRequestRepository';
import { IAllowedEmailRepository } from '../../../domain/repository/iAllowedEmailRepository';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { EmailAlreadyAllowedException } from '../../../domain/exception/emailAlreadyAllowed';
import { AuthEmail } from '../../../domain/valueObject/email';
import { ITransactionRunner } from '@shared/application/port/iTransactionRunner';

/**
 * Approuver, c'est deux écritures : marquer la demande, et ouvrir la liste blanche.
 *
 * Elles sont solidaires. Séparées, un incident entre les deux produisait soit une demande
 * approuvée qui ne laisse toujours pas entrer, soit une adresse autorisée dont la demande
 * reste affichée en attente. Aucun des deux états n'est rattrapable depuis les écrans.
 *
 * Le compte, lui, n'est pas créé ici : il naîtra à la première connexion réussie.
 */
export class ApproveAccessRequestHandler implements ICommandHandler<ApproveAccessRequestCommand> {
    constructor(
        private readonly requests: IAccessRequestRepository,
        private readonly allowed: IAllowedEmailRepository,
        private readonly transaction: ITransactionRunner,
    ) {}

    async handle(command: ApproveAccessRequestCommand): Promise<void> {
        const email = new AuthEmail(command.email);
        const request = await this.requests.findByEmail(email);
        if (!request) throw new NotFoundError('Access request', email.getValue());

        request.approve();

        await this.transaction.run(async () => {
            await this.requests.save(request);
            try {
                await this.allowed.add(email);
            } catch (error) {
                // L'adresse était déjà autorisée — approuver reste l'intention exprimée, et
                // elle est désormais satisfaite. Toute autre panne, elle, fait tomber le tout.
                if (!(error instanceof EmailAlreadyAllowedException)) throw error;
            }
        });
    }
}
