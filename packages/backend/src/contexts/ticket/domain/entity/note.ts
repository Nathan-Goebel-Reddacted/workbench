import { NotNullOrEmptyException } from '@shared/domain/exception/notNullOrEmpty';
import { NoteId } from '../valueObject/noteId';

export class Note {
    private readonly id: NoteId;
    private text: string;

    constructor(id: NoteId, text: string) {
        this.id = id;
        this.text = Note.validText(text);
    }

    getId(): NoteId {
        return this.id;
    }

    getText(): string {
        return this.text;
    }

    rewrite(text: string): void {
        this.text = Note.validText(text);
    }

    private static validText(text: string): string {
        if (text === null || text === undefined || text.trim() === '') {
            throw new NotNullOrEmptyException();
        }
        return text.trim();
    }
}
