import { EntityManager } from '@mikro-orm/postgresql';
import { IFeatureRepository } from '../../domain/repository/iFeatureRepository';
import { Feature } from '../../domain/featureAggregate';
import { FeatureOrmEntity } from '../entity/featureOrmEntity';
import { FeatureId } from '../../domain/valueObject/featureId';
import { ProjectId } from '../../domain/valueObject/projectId';
import { Name } from '../../domain/valueObject/name';
import { Description } from '../../domain/valueObject/description';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { DocumentType } from '@shared/domain/valueObject/documentType';

export class FeatureRepository implements IFeatureRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: string): Promise<Feature | null> {
        const e = await this.em.findOne(FeatureOrmEntity, { id });
        return e ? this.toDomain(e) : null;
    }

    async findByProjectId(projectId: string): Promise<Feature[]> {
        const entities = await this.em.find(FeatureOrmEntity, { projectId });
        return entities.map(e => this.toDomain(e));
    }

    async existsById(id: string): Promise<boolean> {
        return (await this.em.count(FeatureOrmEntity, { id })) > 0;
    }

    async save(feature: Feature): Promise<void> {
        await this.em.transactional(async (em) => {
            await em.upsert(FeatureOrmEntity, this.toOrm(feature));
        });
    }

    private toDomain(e: FeatureOrmEntity): Feature {
        return new Feature(
            new FeatureId(e.id),
            new ProjectId(e.projectId),
            new Name(e.name),
            new Description(e.description),
            e.documents.map(d => new Document(new DocumentId(d.id), d.name, d.url, d.type as DocumentType)),
        );
    }

    private toOrm(feature: Feature): FeatureOrmEntity {
        const e = new FeatureOrmEntity();
        e.id = feature.getId().getValue();
        e.projectId = feature.getProjectId().getValue();
        e.name = feature.getName().getValue();
        e.description = feature.getDescription().getValue();
        e.documents = feature.getDocuments().map(d => ({
            id: d.getId().getValue(),
            name: d.getName(),
            url: d.getUrl(),
            type: d.getType(),
        }));
        return e;
    }
}
