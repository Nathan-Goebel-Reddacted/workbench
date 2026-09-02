import { InvalidAgentToolNameException } from '../exception/invalidAgentToolName';

export class Name {
    private readonly value: string;

    constructor(value: string) {
        if (!value || value.trim().length === 0) {
            throw new InvalidAgentToolNameException();
        }
        this.value = value.trim();
    }

    getValue(): string {
        return this.value;
    }
}
