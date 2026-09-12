import { DomainException } from '@shared/domain/domainException';

export const THEME_NAME_MAX_LENGTH = 60;

export class InvalidThemeNameException extends DomainException {
    constructor() {
        super(`A theme name must hold between 1 and ${THEME_NAME_MAX_LENGTH} characters`);
    }
}
