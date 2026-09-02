export class Description {
    private readonly value: string;

    constructor(value: string = '') {
        this.value = value;
    }

    getValue(): string {
        return this.value;
    }

    isEmpty(): boolean {
        return this.value.trim() === '';
    }
}
