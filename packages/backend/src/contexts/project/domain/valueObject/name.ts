import { InvalidProjectNameException } from '../exception/invalidProjectName';

export class Name {
    private readonly value: string;

    constructor(value: string) {
        const trimmed = (value ?? '').trim();
        if (trimmed === '') throw new InvalidProjectNameException('cannot be empty');
        if (trimmed.length > 255) throw new InvalidProjectNameException('cannot exceed 255 characters');
        this.value = trimmed;
    }

    getValue(): string {
        return this.value;
    }
}
