import { EntityManager } from '@mikro-orm/postgresql';
import { IProjectRepository } from '../../domain/repository/iProjectRepository';
import { Project } from '../../domain/projectAggregate';
import { ProjectOrmEntity } from '../entity/projectOrmEntity';
import { ProjectId } from '../../domain/valueObject/projectId';
import { Name } from '../../domain/valueObject/name';
import { Description } from '../../domain/valueObject/description';
import { Category } from '../../domain/valueObject/category';
import { Link } from '../../domain/valueObject/link';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { DocumentType } from '@shared/domain/valueObject/documentType';

export class ProjectRepository implements IProjectRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: string): Promise<Project | null> {
        const e = await this.em.findOne(ProjectOrmEntity, { id });
        return e ? this.toDomain(e) : null;
    }

    async findAll(): Promise<Project[]> {
        const entities = await this.em.find(ProjectOrmEntity, {}, { orderBy: { name: 'ASC' } });
        return entities.map(e => this.toDomain(e));
    }

    async save(project: Project): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(ProjectOrmEntity, this.toOrm(project));
        });
    }

    private toDomain(e: ProjectOrmEntity): Project {
        return new Project(
            new ProjectId(e.id),
            e.number,
            new Name(e.name),
            new Description(e.description),
            e.documents.map(d => new Document(new DocumentId(d.id), d.name, d.url, d.type as DocumentType)),
            e.links.map(l => new Link(l.url, l.displayText, l.logo)),
            e.visible,
            e.category as Category,
        );
    }

    private toOrm(project: Project): ProjectOrmEntity {
        const e = new ProjectOrmEntity();
        e.id = project.getId().getValue();
        e.number = project.getNumber();
        e.name = project.getName().getValue();
        e.description = project.getDescription().getValue();
        e.visible = project.getVisible();
        e.category = project.getCategory();
        e.documents = project.getDocuments().map(d => ({
            id: d.getId().getValue(),
            name: d.getName(),
            url: d.getUrl(),
            type: d.getType(),
        }));
        e.links = project.getLinks().map(l => ({
            url: l.getUrl(),
            displayText: l.getDisplayText(),
            logo: l.getLogo(),
        }));
        return e;
    }
}
