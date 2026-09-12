import { randomInt } from 'node:crypto';
import { PAIRING_CODE_ALPHABET, PAIRING_CODE_LENGTH } from '../../domain/valueObject/pairingCode';

/** Le tirage du code : sa forme appartient au domaine, son hasard à l'exécution. */
export function generatePairingCode(): string {
    let code = '';
    for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
        code += PAIRING_CODE_ALPHABET[randomInt(PAIRING_CODE_ALPHABET.length)];
    }
    return code;
}
