import { FeatureId } from './valueObject/featureId';
import { Name } from './valueObject/name';
import { Description } from './valueObject/description';
import { FeatureOwner } from './valueObject/featureOwner';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';

export class Feature {
    private readonly featureId: FeatureId;
    /** Projet ou idée. Ne change qu'à la conversion d'une idée en projet. */
    private owner: FeatureOwner;
    /** Numéro dans son porteur : chaque projet ou idée repart à 1. */
    private readonly number: number;
    private name: Name;
    private description: Description;
    private documents: Document[];

    constructor(
        id: FeatureId,
        owner: FeatureOwner,
        number: number,
        name: Name,
        description: Description,
        documents: Document[] = [],
    ) {
        this.featureId = id;
        this.owner = owner;
        this.number = number;
        this.name = name;
        this.description = description;
        this.documents = documents.filter(d => d != null);
    }

    getId(): FeatureId {
        return this.featureId;
    }

    getOwner(): FeatureOwner {
        return this.owner;
    }

    getNumber(): number {
        return this.number;
    }

    /**
     * Seule opération qui déplace une feature : la conversion d'une idée en projet. Le numéro ne
     * bouge pas — le porteur garde le sien, donc les références des tickets restent valides.
     */
    transferTo(owner: FeatureOwner): void {
        this.owner = owner;
    }

    getName(): Name {
        return this.name;
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

    rename(name: Name): void {
        this.name = name;
    }

    describe(description: Description): void {
        this.description = description;
    }
}
