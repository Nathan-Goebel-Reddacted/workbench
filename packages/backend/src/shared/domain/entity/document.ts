import { DocumentId } from '../valueObject/documentId';
import { DocumentType } from '../valueObject/documentType';
import { InvalidDocumentNameException } from '../exception/invalidDocumentName';
import { InvalidDocumentUrlException } from '../exception/invalidDocumentUrl';

export class Document {
    private readonly id: DocumentId;
    private readonly name: string;
    private readonly url: string;
    private readonly type: DocumentType;

    constructor(id: DocumentId, name: string, url: string, type: DocumentType) {
        if (!name || name.trim() === '') {
            throw new InvalidDocumentNameException();
        }
        if (!url || url.trim() === '') {
            throw new InvalidDocumentUrlException();
        }
        this.id = id;
        this.name = name.trim();
        this.url = url;
        this.type = type;
    }

    getId(): DocumentId {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getUrl(): string {
        return this.url;
    }

    getType(): DocumentType {
        return this.type;
    }
}
