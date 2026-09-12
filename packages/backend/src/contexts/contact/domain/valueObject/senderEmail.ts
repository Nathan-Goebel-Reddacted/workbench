import { InvalidSenderEmailException } from '../exception/invalidSenderEmail';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * L'adresse à laquelle répondre, telle que le visiteur l'a écrite dans le formulaire.
 *
 * Elle est facultative : la forme du formulaire est décidée dans l'éditeur, et rien n'oblige
 * à y mettre un champ email. `tryFrom` sert à la sélection — parcourir les champs soumis pour
 * trouver celui qui porte une adresse utilisable, sans faire échouer le reste s'il n'y en a pas.
 */
export class SenderEmail {
    private readonly value: string;

    constructor(value: string) {
        const trimmed = (value ?? '').trim();
        if (!EMAIL_PATTERN.test(trimmed)) throw new InvalidSenderEmailException();
        this.value = trimmed;
    }

    static tryFrom(value: string | null | undefined): SenderEmail | null {
        if (value === null || value === undefined) return null;
        try {
            return new SenderEmail(value);
        } catch {
            return null;
        }
    }

    getValue(): string {
        return this.value;
    }
}
