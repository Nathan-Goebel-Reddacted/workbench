import { InvalidAgentToolTokenException } from '../exception/invalidAgentToolToken';

/** Le jeton tel qu'il est conservé : son empreinte. Le secret en clair ne vit que le temps de rejoindre l'agent. */
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
}
