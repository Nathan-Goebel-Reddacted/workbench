import { InvalidEmailException } from "../exception/invalidEmail";

export class Email {
    private readonly value: string;

    constructor(value: string) {
        const normalized = value?.trim().toLowerCase();
        if (!this.isValid(normalized)) {
            throw new InvalidEmailException();
        }
        this.value = normalized;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: Email): boolean {
        return this.value === other.value;
    }

    private isValid(value: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
}
