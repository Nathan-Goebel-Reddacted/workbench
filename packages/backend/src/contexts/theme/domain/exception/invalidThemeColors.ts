import { DomainException } from '@shared/domain/domainException';

export class InvalidThemeColorsException extends DomainException {
    constructor(reason: string) {
        super(`Invalid theme colors: ${reason}`);
    }
}
