import { Description } from './valueObject/description';
import { Link } from './valueObject/link';
import { Name } from './valueObject/name';
import { ProjectId } from './valueObject/projectId';
import { Category } from './valueObject/category';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';

export class Project {
    private readonly id: ProjectId;
    /** Numéro de porteur, premier segment des références de tickets. Immuable une fois attribué. */
    private readonly number: number;
    private name: Name;
    private description: Description;
    private visible: boolean;
    private category: Category;
    private documents: Document[];
    private links: Link[];

    constructor(
        id: ProjectId,
        number: number,
        name: Name,
        description: Description,
        documents: Document[] = [],
        links: Link[] = [],
        // Un projet naît privé : le publier est un geste volontaire, pas un défaut subi.
        visible: boolean = false,
        category: Category = Category.Personal,
    ) {
        this.id = id;
        this.number = number;
        this.name = name;
        this.description = description;
        this.visible = visible;
        this.category = category;
        this.documents = documents.filter(d => d != null);
        this.links = links;
    }

    getId(): ProjectId {
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

    isVisible(): boolean {
        return this.visible;
    }

    getCategory(): Category {
        return this.category;
    }

    rename(name: Name): void {
        this.name = name;
    }

    describe(description: Description): void {
        this.description = description;
    }

    /** Le projet rejoint le site public. */
    publish(): void {
        this.visible = true;
    }

    /** Il en sort sans disparaître : le retrait est réversible. */
    hide(): void {
        this.visible = false;
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
