export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_STACK_LENGTH = 8000;
export const MAX_URL_LENGTH = 500;

/**
 * Un texte plafonné.
 *
 * Le journal ne refuse rien : refuser une entrée, c'est perdre exactement ce qu'il existe
 * pour garder. Un texte trop long est donc coupé, pas rejeté — d'où un objet-valeur qui
 * tronque au lieu de lever. C'est la seule règle du contexte, et elle vaut d'être nommée.
 */
export class BoundedText {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    /** Texte obligatoire : une entrée sans message dirait qu'il ne s'est rien passé. */
    static required(value: string, max: number, fallback: string): BoundedText {
        const trimmed = (value ?? '').trim() || fallback;
        return new BoundedText(truncate(trimmed, max));
    }

    /** Texte facultatif : absent ou vide, il vaut `null`. */
    static optional(value: string | null | undefined, max: number): BoundedText | null {
        const trimmed = value?.trim();
        return trimmed ? new BoundedText(truncate(trimmed, max)) : null;
    }

    getValue(): string {
        return this.value;
    }
}

function truncate(value: string, max: number): string {
    return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
