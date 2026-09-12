import { Command } from '@shared/application/command/command';

/**
 * Ce qu'un fournisseur OAuth nous a appris d'une personne. L'adresse est vérifiée par lui :
 * la route l'extrait de sa réponse, elle ne l'invente pas.
 */
export class ProvisionUserFromOAuthCommand implements Command {
    static readonly commandName = 'auth.ProvisionUserFromOAuth';
    readonly commandName = ProvisionUserFromOAuthCommand.commandName;

    constructor(
        readonly email: string,
        readonly name: string,
        readonly surname: string,
    ) {}
}

/** Issue d'une tentative de connexion : soit une session à ouvrir, soit une demande d'accès. */
export type ProvisionOutcome =
    | { readonly kind: 'session'; readonly user: ProvisionedUser }
    | { readonly kind: 'accessRequested'; readonly status: string };

export type ProvisionedUser = Readonly<{
    id: string;
    email: string;
    roles: string[];
    tokenVersion: number;
}>;
