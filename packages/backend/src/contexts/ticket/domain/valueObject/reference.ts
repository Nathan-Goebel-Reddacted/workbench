import { InvalidReferenceException } from "../exception/invalidReference";
import { NotNullOrEmptyException } from "../exception/notNullOrEmpty";

export class TicketReference {

    private static readonly FORMAT = /^\d{4}\.\d+$/;

    private readonly value: string;

    constructor(value: string) {
        if (!this.notNullOrEmpty(value)) {
            throw new NotNullOrEmptyException();
        }
        if (!this.validFormat(value)) {
            throw new InvalidReferenceException();
        }
        this.value = value;
    }

    private notNullOrEmpty(value: string): boolean {
        return value !== null && value.trim() !== '';
    }

    private validFormat(value: string): boolean {
        return TicketReference.FORMAT.test(value);
    }

    static create(featureRef: string, position: number): TicketReference {
        return new TicketReference(`${featureRef}.${position}`);
    }

    getValue(): string {
        return this.value;
    }

    getFeatureRef(): string {
        return this.value.split('.')[0];
    }

    getPosition(): number {
        return parseInt(this.value.split('.')[1], 10);
    }

    equals(other: TicketReference): boolean {
        return this.value === other.value;
    }
}
