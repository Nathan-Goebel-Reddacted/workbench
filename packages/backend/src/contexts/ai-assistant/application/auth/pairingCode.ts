import { randomInt } from 'node:crypto';

/** Crockford-style alphabet: no I, L, O, U, so a code read aloud or retyped stays unambiguous. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const CODE_LENGTH = 8;
const PREFIX_LENGTH = 4;

/** A pairing request waits for a human decision, which may not come the same day. */
export const PAIRING_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generatePairingCode(): string {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += ALPHABET[randomInt(ALPHABET.length)];
    }
    return code;
}

/** Accepts what a human may retype: lowercase, spaces, dashes. */
export function normalizePairingCode(raw: string): string {
    return raw.replace(/[\s-]/g, '').toUpperCase();
}

export function pairingCodePrefix(code: string): string {
    return code.slice(0, PREFIX_LENGTH);
}

/** Display form, e.g. ABCD-2345. */
export function formatPairingCode(code: string): string {
    return `${code.slice(0, PREFIX_LENGTH)}-${code.slice(PREFIX_LENGTH)}`;
}
