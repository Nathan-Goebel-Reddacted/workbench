import { DomainException } from '@shared/domain/domainException';

export class InvalidTransformException extends DomainException {
    constructor(referenceWidth: number, maxPageHeight: number) {
        super(
            `Transform x/y/w/h must be integers, x/y >= 0, w/h >= 1, x + w <= ${referenceWidth} and y + h <= ${maxPageHeight}`,
        );
    }
}
