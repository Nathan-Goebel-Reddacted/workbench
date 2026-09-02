import { DomainException } from '@shared/domain/domainException';

export class NoteNotFoundException extends DomainException {
    constructor(index: number) {
        super();
        this.name = 'NoteNotFoundException';
        this.message = `The ticket has no note at position ${index}`;
    }
}
