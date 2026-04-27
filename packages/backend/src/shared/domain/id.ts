import { randomUUID } from "crypto";

export abstract class Id {
    private readonly value: string;

    constructor(value?: string) {
        this.value = value ?? randomUUID();
    }

    getValue(): string {
        return this.value;
    }

    equals(other: Id): boolean {
        return this.value === other.value;
    }
}
