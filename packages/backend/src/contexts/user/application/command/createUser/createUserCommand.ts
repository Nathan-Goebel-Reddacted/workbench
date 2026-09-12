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

/** Ce que cette commande peut refuser : l'adresse est déjà portée par un compte. */
export { UserAlreadyExistsException } from '@contexts/user/domain/exception/userAlreadyExists';
