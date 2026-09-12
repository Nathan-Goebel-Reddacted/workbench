import { Command } from '@shared/application/command/command';

export class RejectPairingRequestCommand implements Command {
    static readonly commandName = 'aiAssistant.RejectPairingRequest';
    readonly commandName: string;

    constructor(readonly id: string) {
        this.commandName = RejectPairingRequestCommand.commandName;
    }
}
