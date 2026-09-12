import { CV_NAME_MAX_LENGTH, InvalidCvNameException } from '../exception/invalidCvName';

export class CvName {
    private readonly value: string;

    constructor(value: string) {
        const trimmed = (value ?? '').trim();
        if (trimmed === '' || trimmed.length > CV_NAME_MAX_LENGTH) throw new InvalidCvNameException();
        this.value = trimmed;
    }

    getValue(): string {
        return this.value;
    }
}
