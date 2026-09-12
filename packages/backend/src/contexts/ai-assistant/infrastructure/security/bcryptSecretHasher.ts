import bcrypt from 'bcrypt';
import { ISecretHasher } from '../../domain/port/iSecretHasher';

const COST = 12;

export class BcryptSecretHasher implements ISecretHasher {
    async hash(secret: string): Promise<string> {
        return bcrypt.hash(secret, COST);
    }

    async matches(candidate: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(candidate, hashed);
    }
}
