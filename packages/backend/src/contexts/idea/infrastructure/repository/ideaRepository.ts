import { EntityManager } from '@mikro-orm/postgresql';
import { IIdeaRepository } from '../../domain/repository/iIdeaRepository';
import { Idea } from '../../domain/ideaAggregate';
import { IdeaOrmEntity } from '../entity/ideaOrmEntity';
import { IdeaId } from '../../domain/valueObject/ideaId';
import { Description } from '../../domain/valueObject/description';
import { Link } from '../../domain/valueObject/link';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { DocumentType } from '@shared/domain/valueObject/documentType';

export class IdeaRepository implements IIdeaRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: string): Promise<Idea | null> {
        const e = await this.em.findOne(IdeaOrmEntity, { id });
        return e ? this.toDomain(e) : null;
    }

    async save(idea: Idea): Promise<void> {
        await this.em.transactional(async (em) => {
            await em.upsert(IdeaOrmEntity, this.toOrm(idea));
        });
    }

    private toDomain(e: IdeaOrmEntity): Idea {
        return new Idea(
            new IdeaId(e.id),
            new Description(e.description),
            e.documents.map(d => new Document(new DocumentId(d.id), d.name, d.url, d.type as DocumentType)),
            e.links.map(l => new Link(l.url, l.displayText, l.logo)),
        );
    }

    private toOrm(idea: Idea): IdeaOrmEntity {
        const e = new IdeaOrmEntity();
        e.id = idea.getId().getValue();
        e.description = idea.getDescription().getValue();
        e.documents = idea.getDocuments().map(d => ({
            id: d.getId().getValue(),
            name: d.getName(),
            url: d.getUrl(),
            type: d.getType(),
        }));
        e.links = idea.getLinks().map(l => ({
            url: l.getUrl(),
            displayText: l.getDisplayText(),
            logo: l.getLogo(),
        }));
        return e;
    }
}
