import { Feature } from "../featureAggregate";
import { FeatureId } from "../valueObject/featureId";
import { ProjectId } from "../valueObject/projectId";
import { Name } from "../valueObject/name";
import { Description } from "../valueObject/description";
import { Document } from "@shared/domain/entity/document";
import { DocumentId } from "@shared/domain/valueObject/documentId";
import { DocumentType } from "@shared/domain/valueObject/documentType";

type DocumentInput = { id: string; name: string; url: string; type: string };

export class FeatureFactory {
    create(id: string, projectId: string, name: string, description: string, documents: DocumentInput[] = []): Feature {
        return new Feature(
            new FeatureId(id),
            new ProjectId(projectId),
            new Name(name),
            new Description(description),
            documents.map(d => new Document(new DocumentId(d.id), d.name, d.url, d.type as DocumentType)),
        );
    }
}
