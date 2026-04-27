import { NotNullOrEmptyException } from "../exception/notNullOrEmpty";

export class Surname {

    private readonly value: string;

    constructor(value: string) {
        if (!this.notNullOrEmpty(value)) {
            throw new NotNullOrEmptyException();
        }
        const trimmed = value.trim().toLowerCase();
        this.value = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }

    public getValue(): string {
        return this.value;
    }

    private notNullOrEmpty(value: string): boolean {
        return value !== null && value.trim() !== '';
    }
}