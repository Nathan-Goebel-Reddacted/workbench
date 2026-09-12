import { Command } from '@shared/application/command/command';

export class ApprovePairingRequestCommand implements Command {
    static readonly commandName = 'aiAssistant.ApprovePairingRequest';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly userId: string,
        /** Absents, les scopes demandés par l'agent font foi. Présents, ce sont eux qui sont accordés. */
        readonly scopes?: string[],
        readonly permission?: string,
    ) {
        this.commandName = ApprovePairingRequestCommand.commandName;
    }
}

export type ApprovalOutcome =
    | Readonly<{ outcome: 'approved'; agentToolId: string; scopes: string[]; permission: string }>
    | Readonly<{ outcome: 'alreadyDecided'; status: string }>;
