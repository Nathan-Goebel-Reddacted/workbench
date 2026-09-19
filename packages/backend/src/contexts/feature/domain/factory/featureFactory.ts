import { Feature } from '../featureAggregate';
import { FeatureId } from '../valueObject/featureId';
import { FeatureOwner } from '../valueObject/featureOwner';
import { Name } from '../valueObject/name';
import { Description } from '../valueObject/description';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';

type DocumentInput = { id: string; name: string; url: string };

export class FeatureFactory {
    create(
        id: string,
        ownerType: string,
        ownerId: string,
        number: number,
        name: string,
        description: string,
        documents: DocumentInput[] = [],
    ): Feature {
        return new Feature(
            new FeatureId(id),
            new FeatureOwner(ownerType, ownerId),
            number,
            new Name(name),
            new Description(description),
            documents.map(d => new Document(new DocumentId(d.id), d.name, d.url)),
        );
    }
}
