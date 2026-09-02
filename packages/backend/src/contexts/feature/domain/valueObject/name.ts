import { NotNullOrEmptyException } from '../exception/notNullOrEmpty';

export class Name {
    private readonly value: string;

    constructor(value: string) {
        if (!value || value.trim() === '') {
            throw new NotNullOrEmptyException();
        }
        this.value = value;
    }

    getValue(): string {
        return this.value;
    }
}
