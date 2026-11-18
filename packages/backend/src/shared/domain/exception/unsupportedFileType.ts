import { DomainException } from '../domainException';

export class UnsupportedFileTypeException extends DomainException {
    constructor(extension: string) {
        super(`Unsupported file type: ${extension || 'none'}`);
    }
}
