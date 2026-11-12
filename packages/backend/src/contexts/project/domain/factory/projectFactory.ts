import { Project } from '../projectAggregate';
import { ProjectId } from '../valueObject/projectId';
import { Name } from '../valueObject/name';
import { Description } from '../valueObject/description';
import { Category } from '../valueObject/category';
import { Link } from '../valueObject/link';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';

type LinkInput = { url: string; displayText: string; logo: string; replacesPage?: boolean };
type DocumentInput = { id: string; name: string; url: string };

export class ProjectFactory {
    create(
        id: string,
        number: number,
        name: string,
        description: string,
        links: LinkInput[] = [],
        documents: DocumentInput[] = [],
        visible: boolean = false,
        category: Category = Category.Personal,
    ): Project {
        return new Project(
            new ProjectId(id),
            number,
            new Name(name),
            new Description(description),
            documents.map(d => new Document(new DocumentId(d.id), d.name, d.url)),
            links.map(l => new Link(l.url, l.displayText, l.logo, l.replacesPage ?? false)),
            visible,
            category,
        );
    }
}
