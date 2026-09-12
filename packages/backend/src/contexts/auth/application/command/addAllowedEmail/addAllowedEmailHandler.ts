import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddAllowedEmailCommand } from './addAllowedEmailCommand';
import { IAllowedEmailRepository } from '../../../domain/repository/iAllowedEmailRepository';
import { AuthEmail } from '../../../domain/valueObject/email';

export class AddAllowedEmailHandler implements ICommandHandler<AddAllowedEmailCommand> {
    constructor(private readonly allowed: IAllowedEmailRepository) {}

    async handle(command: AddAllowedEmailCommand): Promise<void> {
        await this.allowed.add(new AuthEmail(command.email));
    }
}
