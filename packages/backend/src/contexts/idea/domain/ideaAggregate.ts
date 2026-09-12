import { Category } from './valueObject/category';
import { Description } from './valueObject/description';
import { Link } from './valueObject/link';
import { Name } from './valueObject/name';
import { IdeaId } from './valueObject/ideaId';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';

export class Idea {
    private readonly id: IdeaId;
    /** Numéro de porteur, partagé avec les projets : il survit à la conversion. */
    private readonly number: number;
    private name: Name;
    private description: Description;
    private readonly createdAt: Date;
    private documents: Document[];
    private links: Link[];
    private category: Category;

    constructor(
        id: IdeaId,
        number: number,
        name: Name,
        description: Description,
        documents: Document[] = [],
        links: Link[] = [],
        createdAt: Date = new Date(),
        category: Category = Category.Personal,
    ) {
        this.id = id;
        this.number = number;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
        this.documents = documents.filter(d => d != null);
        this.links = links;
        this.category = category;
    }

    getId(): IdeaId {
        return this.id;
    }

    getNumber(): number {
        return this.number;
    }

    getName(): Name {
        return this.name;
    }

    getDescription(): Description {
        return this.description;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    rename(name: Name): void {
        this.name = name;
    }

    describe(description: Description): void {
        this.description = description;
    }

    getCategory(): Category {
        return this.category;
    }

    reclassify(category: Category): void {
        this.category = category;
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
