import { DomainException } from "@shared/domain/domainException";

export class InvalidLogoException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidLogoException';
        this.message = 'Logo must be a valid image path (.png, .jpg, .jpeg, .svg, .webp)';
    }
}
