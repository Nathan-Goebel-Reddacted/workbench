import { NotNullOrEmptyException } from '@shared/domain/exception/notNullOrEmpty';

export class Name {
    private readonly value: string;

    constructor(value: string) {
        if (!this.notNullOrEmpty(value)) {
            throw new NotNullOrEmptyException();
        }
        this.value = value.trim().toUpperCase();
    }

    public getValue(): string {
        return this.value;
    }

    private notNullOrEmpty(value: string): boolean {
        return value !== null && value.trim() !== '';
    }
}
