import { Description } from "./valueObject/description";
import { FeatureId } from "./valueObject/featureId";
import { Note } from "./valueObject/note";
import { TicketReference } from "./valueObject/reference";
import { TicketStatus } from "./valueObject/status";
import { TicketId } from "./valueObject/ticketId";
import { Title } from "./valueObject/title";
import { Document } from "@shared/domain/entity/document";
import { DocumentId } from "@shared/domain/valueObject/documentId";

export class Ticket {
    private readonly id: TicketId;
    private readonly reference: TicketReference;
    private readonly featureId: FeatureId;
    private title: Title;
    private description: Description;
    private status: TicketStatus;
    private notes: Note[];
    private documents: Document[];

    constructor(
        id: TicketId,
        reference: TicketReference,
        featureId: FeatureId,
        title: Title,
        description: Description,
        status: TicketStatus = TicketStatus.Pending,
        notes: Note[] = [],
        documents: Document[] = [],
    ) {
        this.id = id;
        this.reference = reference;
        this.featureId = featureId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.notes = notes.filter(n => n != null);
        this.documents = documents.filter(d => d != null);
    }

    getId(): TicketId {
        return this.id;
    }

    getReference(): TicketReference {
        return this.reference;
    }

    getFeatureId(): FeatureId {
        return this.featureId;
    }

    getTitle(): Title {
        return this.title;
    }

    getDescription(): Description {
        return this.description;
    }

    getStatus(): TicketStatus {
        return this.status;
    }

    getNotes(): Note[] {
        return [...this.notes];
    }

    setTitle(title: Title): void {
        this.title = title;
    }

    setDescription(description: Description): void {
        this.description = description;
    }

    setStatus(status: TicketStatus): void {
        this.status = status;
    }

    addNote(note: Note): void {
        this.notes.push(note);
    }

    getDocuments(): Document[] {
        return [...this.documents];
    }

    addDocument(doc: Document): void {
        const alreadyExists = this.documents.some(d => d.getId().equals(doc.getId()));
        if (alreadyExists) return;
        this.documents.push(doc);
    }

    removeDocument(id: DocumentId): void {
        this.documents = this.documents.filter(d => !d.getId().equals(id));
    }
}
