import { Command } from '@shared/application/command/command';

export class ClaimPairingRequestCommand implements Command {
    static readonly commandName = 'aiAssistant.ClaimPairingRequest';
    readonly commandName: string;

    constructor(readonly code: string) {
        this.commandName = ClaimPairingRequestCommand.commandName;
    }
}

/**
 * `unknown` couvre le code inconnu, périmé, déjà réclamé et refusé — indistinctement. Qui
 * présente un code ne doit pas pouvoir apprendre lequel de ces cas il a touché.
 */
export type ClaimOutcome =
    | Readonly<{ status: 'unknown' }>
    | Readonly<{ status: 'pending' }>
    | Readonly<{ status: 'approved'; token: string }>;
