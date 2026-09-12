import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RejectAccessRequestCommand } from './rejectAccessRequestCommand';
import { IAccessRequestRepository } from '../../../domain/repository/iAccessRequestRepository';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { AuthEmail } from '../../../domain/valueObject/email';

export class RejectAccessRequestHandler implements ICommandHandler<RejectAccessRequestCommand> {
    constructor(private readonly requests: IAccessRequestRepository) {}

    async handle(command: RejectAccessRequestCommand): Promise<void> {
        const email = new AuthEmail(command.email);
        const request = await this.requests.findByEmail(email);
        if (!request) throw new NotFoundError('Access request', email.getValue());

        request.reject();
        await this.requests.save(request);
    }
}
