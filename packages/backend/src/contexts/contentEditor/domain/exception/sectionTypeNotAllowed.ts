import { DomainException } from '@shared/domain/domainException';

export class SectionTypeNotAllowedException extends DomainException {
    constructor(sectionType: string, pageType: string) {
        super(`A "${sectionType}" section cannot be placed on a ${pageType} page`);
    }
}
