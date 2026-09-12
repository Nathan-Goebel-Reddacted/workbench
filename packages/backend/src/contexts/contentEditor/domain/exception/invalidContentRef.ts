import { DomainException } from '@shared/domain/domainException';

export class InvalidContentRefException extends DomainException {
    constructor() {
        super('ContentRef must follow the format "context.field"');
    }
}
