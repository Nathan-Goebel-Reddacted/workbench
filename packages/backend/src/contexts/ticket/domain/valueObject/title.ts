import { NotNullOrEmptyException } from '@shared/domain/exception/notNullOrEmpty';

export class Title {
    private readonly value: string;

    constructor(value: string) {
        if (!this.notNullOrEmpty(value)) {
            throw new NotNullOrEmptyException();
        }
        this.value = value.trim();
    }

    getValue(): string {
        return this.value;
    }

    equals(other: Title): boolean {
        return this.value === other.value;
    }

    private notNullOrEmpty(value: string): boolean {
        return value !== null && value.trim() !== '';
    }
}
