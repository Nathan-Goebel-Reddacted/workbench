import bcrypt from 'bcrypt';
import { InvalidAgentToolTokenException } from '../exception/invalidAgentToolToken';

export class Token {
    private readonly value: string;

    constructor(value: string) {
        if (!value || value.trim().length === 0) {
            throw new InvalidAgentToolTokenException();
        }
        this.value = value;
    }

    getValue(): string {
        return this.value;
    }

    async verify(candidate: string): Promise<boolean> {
        return bcrypt.compare(candidate, this.value);
    }

    static async hash(rawToken: string): Promise<Token> {
        const hashed = await bcrypt.hash(rawToken, 12);
        return new Token(hashed);
    }
}
