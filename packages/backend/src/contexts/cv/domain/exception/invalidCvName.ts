import { DomainException } from '@shared/domain/domainException';

export const CV_NAME_MAX_LENGTH = 255;

export class InvalidCvNameException extends DomainException {
    constructor() {
        super(`A CV name must hold between 1 and ${CV_NAME_MAX_LENGTH} characters`);
    }
}
