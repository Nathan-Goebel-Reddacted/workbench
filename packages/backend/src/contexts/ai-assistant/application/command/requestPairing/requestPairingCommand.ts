import { Command } from '@shared/application/command/command';

export class RequestPairingCommand implements Command {
    static readonly commandName = 'aiAssistant.RequestPairing';
    readonly commandName: string;

    constructor(
        readonly name: string,
        readonly scopes: string[],
        readonly permission: string,
    ) {
        this.commandName = RequestPairingCommand.commandName;
    }
}

/** Le code en clair ne repasse jamais par là : c'est l'unique fois où l'appelant le voit. */
export type IssuedPairing = Readonly<{ code: string; expiresAt: Date }>;
