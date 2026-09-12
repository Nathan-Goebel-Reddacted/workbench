import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RemoveAllowedEmailCommand } from './removeAllowedEmailCommand';
import { IAllowedEmailRepository } from '../../../domain/repository/iAllowedEmailRepository';
import { AuthEmail } from '../../../domain/valueObject/email';

export class RemoveAllowedEmailHandler implements ICommandHandler<RemoveAllowedEmailCommand> {
    constructor(private readonly allowed: IAllowedEmailRepository) {}

    async handle(command: RemoveAllowedEmailCommand): Promise<void> {
        await this.allowed.remove(new AuthEmail(command.email));
    }
}
