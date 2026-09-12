import { DomainException } from '@shared/domain/domainException';

export class InvalidLogoException extends DomainException {
    constructor() {
        super('Logo must be a valid image path (.png, .jpg, .jpeg, .svg, .webp)');
    }
}
