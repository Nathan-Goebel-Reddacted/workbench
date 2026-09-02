import { Idea } from '../ideaAggregate';
import { Category } from '../valueObject/category';
import { IdeaId } from '../valueObject/ideaId';
import { Description } from '../valueObject/description';
import { Link } from '../valueObject/link';
import { Name } from '../valueObject/name';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { DocumentType } from '@shared/domain/valueObject/documentType';

type LinkInput = { url: string; displayText: string; logo: string };
type DocumentInput = { id: string; name: string; url: string; type: string };

export class IdeaFactory {
    create(
        id: string,
        number: number,
        name: string,
        description: string,
        links: LinkInput[] = [],
        documents: DocumentInput[] = [],
        createdAt: Date = new Date(),
        category: Category = Category.Personal,
    ): Idea {
        return new Idea(
            new IdeaId(id),
            number,
            new Name(name),
            new Description(description),
            documents.map(d => new Document(new DocumentId(d.id), d.name, d.url, d.type as DocumentType)),
            links.map(l => new Link(l.url, l.displayText, l.logo)),
            createdAt,
            category,
        );
    }
}
