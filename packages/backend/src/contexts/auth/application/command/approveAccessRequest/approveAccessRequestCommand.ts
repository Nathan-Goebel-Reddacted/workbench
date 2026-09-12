import { Command } from '@shared/application/command/command';

export class ApproveAccessRequestCommand implements Command {
    static readonly commandName = 'auth.ApproveAccessRequest';
    readonly commandName = ApproveAccessRequestCommand.commandName;

    constructor(readonly email: string) {}
}
