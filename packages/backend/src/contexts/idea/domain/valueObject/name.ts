import { InvalidIdeaNameException } from '../exception/invalidIdeaName';

export class Name {
    private readonly value: string;

    constructor(value: string) {
        const trimmed = (value ?? '').trim();
        if (trimmed === '') throw new InvalidIdeaNameException('cannot be empty');
        if (trimmed.length > 255) throw new InvalidIdeaNameException('cannot exceed 255 characters');
        this.value = trimmed;
    }

    getValue(): string {
        return this.value;
    }
}
