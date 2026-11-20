import { DomainException } from '@shared/domain/domainException';

export class TooManyElementsException extends DomainException {
    constructor(max: number) {
        super(`A page holds at most ${max} elements`);
    }
}
