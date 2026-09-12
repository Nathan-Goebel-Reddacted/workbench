import { DomainException } from '@shared/domain/domainException';

export class CvMustBePdfException extends DomainException {
    constructor() {
        super('A CV must reference a PDF file');
    }
}
