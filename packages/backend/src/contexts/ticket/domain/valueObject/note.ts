import { NotNullOrEmptyException } from "../exception/notNullOrEmpty";

export class Note {

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

    private notNullOrEmpty(value: string): boolean {
        return value !== null && value.trim() !== '';
    }
}
