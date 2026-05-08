import { Description } from "./valueObject/description";
import { Link } from "./valueObject/link";
import { ProjectId } from "./valueObject/projectId";
import { Document } from "@shared/domain/entity/document";
import { DocumentId } from "@shared/domain/valueObject/documentId";

export class Project {
    private readonly id: ProjectId;
    private readonly description: Description;
    private documents: Document[];
    private links: Link[];

    constructor(id: ProjectId, description: Description, documents: Document[] = [], links: Link[] = []) {
        this.id = id;
        this.description = description;
        this.documents = documents.filter(d => d != null);
        this.links = links;
    }

    getId(): ProjectId {
        return this.id;
    }

    getDescription(): Description {
        return this.description;
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

    getLinks(): Link[] {
        return [...this.links];
    }

    addLink(link: Link): void {
        this.links.push(link);
    }

    removeLink(link: Link): void {
        this.links = this.links.filter(l => l.getUrl() !== link.getUrl());
    }
}