import { InvalidContentRefException } from "../exception/invalidContentRef";

export class ContentRef {
    private readonly value: string;

    constructor(value: string) {
        if (!value || !value.trim() || !value.includes('.')) {
            throw new InvalidContentRefException();
        }
        this.value = value.trim();
    }

    getValue(): string {
        return this.value;
    }

    equals(other: ContentRef): boolean {
        return this.value === other.value;
    }
}
