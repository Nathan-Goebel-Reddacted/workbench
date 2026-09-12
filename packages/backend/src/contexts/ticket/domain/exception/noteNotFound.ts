import { DomainException } from '@shared/domain/domainException';

export class NoteNotFoundException extends DomainException {
    constructor(index: number) {
        super(`The ticket has no note at position ${index}`);
    }
}
