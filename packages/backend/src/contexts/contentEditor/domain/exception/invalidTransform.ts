import { DomainException } from '@shared/domain/domainException';

export class InvalidTransformException extends DomainException {
    constructor(screen: string, width: number, maxHeight: number) {
        super(
            `Transform x/y/w/h on ${screen} must be integers, x/y >= 0, w/h >= 1, x + w <= ${width} and y + h <= ${maxHeight}`,
        );
    }
}
