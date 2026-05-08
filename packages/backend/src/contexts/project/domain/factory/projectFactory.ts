import { Project } from "../projectAggregate";
import { ProjectId } from "../valueObject/projectId";
import { Description } from "../valueObject/description";
import { Link } from "../valueObject/link";
import { Document } from "@shared/domain/entity/document";
import { DocumentId } from "@shared/domain/valueObject/documentId";
import { DocumentType } from "@shared/domain/valueObject/documentType";

type LinkInput = { url: string; displayText: string; logo: string };
type DocumentInput = { id: string; name: string; url: string; type: string };

export class ProjectFactory {
    create(id: string, description: string, links: LinkInput[] = [], documents: DocumentInput[] = []): Project {
        return new Project(
            new ProjectId(id),
            new Description(description),
            documents.map(d => new Document(new DocumentId(d.id), d.name, d.url, d.type as DocumentType)),
            links.map(l => new Link(l.url, l.displayText, l.logo)),
        );
    }
}
