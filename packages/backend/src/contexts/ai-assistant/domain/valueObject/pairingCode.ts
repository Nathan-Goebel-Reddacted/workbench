import { InvalidPairingCodeException } from '../exception/invalidPairingCode';

/** Alphabet à la Crockford : ni I, ni L, ni O, ni U — un code lu à voix haute ou retapé reste sans ambiguïté. */
export const PAIRING_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
export const PAIRING_CODE_LENGTH = 8;
const PREFIX_LENGTH = 4;

/** Accepte ce qu'un humain peut retaper : minuscules, espaces, tirets. */
export function normalizePairingCode(raw: string): string {
    return raw.replace(/[\s-]/g, '').toUpperCase();
}

/** Forme d'affichage, p. ex. ABCD-2345. */
export function formatPairingCode(code: string): string {
    return `${code.slice(0, PREFIX_LENGTH)}-${code.slice(PREFIX_LENGTH)}`;
}

/**
 * Le code d'appairage tel qu'il est conservé : une empreinte, et son préfixe en clair.
 *
 * L'empreinte seule ne se cherche pas — c'est tout son intérêt. Le préfixe est le grain par
 * lequel une demande se retrouve : assez pour ramener une poignée de lignes, trop court pour
 * valoir la peine d'être deviné.
 */
export class PairingCode {
    private readonly digest: string;
    private readonly prefix: string;

    constructor(digest: string, prefix: string) {
        if (!digest || digest.trim().length === 0 || !prefix || prefix.trim().length === 0) {
            throw new InvalidPairingCodeException();
        }
        this.digest = digest;
        this.prefix = prefix;
    }

    static prefixOf(code: string): string {
        return code.slice(0, PREFIX_LENGTH);
    }

    getDigest(): string {
        return this.digest;
    }

    getPrefix(): string {
        return this.prefix;
    }
}
