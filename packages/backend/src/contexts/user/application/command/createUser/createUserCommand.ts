import { Command } from '@shared/application/command/command';

export class CreateUserCommand implements Command {
    static readonly commandName = 'user.CreateUser';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly surname: string,
        readonly email: string,
        readonly roles: string[],
    ) {
        this.commandName = CreateUserCommand.commandName;
    }
}
