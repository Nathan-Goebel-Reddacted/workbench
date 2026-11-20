import { DomainException } from '@shared/domain/domainException';

export class InvalidLayoutException extends DomainException {
    constructor(screen: string) {
        super(`A layout needs one placement on ${screen}, expressed on that screen size`);
    }
}
