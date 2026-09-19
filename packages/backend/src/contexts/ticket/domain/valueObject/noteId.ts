import { Id } from '@shared/domain/id';

export class NoteId extends Id {
    constructor(value?: string) {
        super(value);
    }
}
