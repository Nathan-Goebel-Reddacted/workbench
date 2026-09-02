import { Command } from '@shared/application/command/command';

export class RotateAgentToolTokenCommand implements Command {
    static readonly commandName = 'aiAssistant.RotateAgentToolToken';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly newToken: string,
    ) {
        this.commandName = RotateAgentToolTokenCommand.commandName;
    }
}
