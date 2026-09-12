import { Command } from '@shared/application/command/command';

export class RejectAccessRequestCommand implements Command {
    static readonly commandName = 'auth.RejectAccessRequest';
    readonly commandName = RejectAccessRequestCommand.commandName;

    constructor(readonly email: string) {}
}
