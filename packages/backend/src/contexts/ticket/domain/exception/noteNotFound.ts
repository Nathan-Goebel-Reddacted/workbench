import { DomainException } from '@shared/domain/domainException';

export class NoteNotFoundException extends DomainException {
    constructor(noteId: string) {
        super(`The ticket has no note ${noteId}`);
    }
}
