import { EntityManager } from '@mikro-orm/postgresql';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { IFeatureRepository } from '../../domain/repository/iFeatureRepository';
import { Feature } from '../../domain/featureAggregate';
import { FeatureOrmEntity } from '../entity/featureOrmEntity';
import { FeatureId } from '../../domain/valueObject/featureId';
import { FeatureOwner, OwnerType } from '../../domain/valueObject/featureOwner';
import { Name } from '../../domain/valueObject/name';
import { Description } from '../../domain/valueObject/description';
import { DuplicateFeatureNumberException } from '../../domain/exception/duplicateFeatureNumber';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { DocumentType } from '@shared/domain/valueObject/documentType';

export class FeatureRepository implements IFeatureRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: string): Promise<Feature | null> {
        const e = await this.em.findOne(FeatureOrmEntity, { id });
        return e ? this.toDomain(e) : null;
    }

    async findByOwner(ownerType: OwnerType, ownerId: string): Promise<Feature[]> {
        const entities = await this.em.find(FeatureOrmEntity, { ownerType, ownerId }, { orderBy: { number: 'asc' } });
        return entities.map(e => this.toDomain(e));
    }

    async findByOwners(ownerType: OwnerType, ownerIds: string[]): Promise<Feature[]> {
        if (ownerIds.length === 0) return [];
        const entities = await this.em.find(
            FeatureOrmEntity,
            { ownerType, ownerId: { $in: ownerIds } },
            { orderBy: { number: 'asc' } },
        );
        return entities.map(e => this.toDomain(e));
    }

    async existsById(id: string): Promise<boolean> {
        return (await this.em.count(FeatureOrmEntity, { id })) > 0;
    }

    async lastNumberOf(ownerType: OwnerType, ownerId: string): Promise<number> {
        const [row] = await this.em
            .getConnection()
            .execute<
                Array<{ max: number | null }>
            >('select max("number") as max from features where owner_type = ? and owner_id = ?', [ownerType, ownerId]);
        return row?.max ?? 0;
    }

    async delete(id: string): Promise<void> {
        await this.em.transactional(async em => {
            await em.nativeDelete(FeatureOrmEntity, { id });
        });
    }

    async save(feature: Feature): Promise<void> {
        try {
            await this.em.transactional(async em => {
                // La cible du conflit est explicite : l'entité porte aussi un unique composite
                // (porteur + numéro), qu'un upsert pourrait choisir à notre place.
                await em.upsert(FeatureOrmEntity, this.toOrm(feature), { onConflictFields: ['id'] });
            });
        } catch (err) {
            // Deux features créées en même temps chez le même porteur ont calculé le même numéro :
            // l'appelant retente, il en obtiendra un libre.
            if (err instanceof UniqueConstraintViolationException) {
                throw new DuplicateFeatureNumberException();
            }
            throw err;
        }
    }

    private toDomain(e: FeatureOrmEntity): Feature {
        return new Feature(
            new FeatureId(e.id),
            new FeatureOwner(e.ownerType, e.ownerId),
            e.number,
            new Name(e.name),
            new Description(e.description),
            e.documents.map(d => new Document(new DocumentId(d.id), d.name, d.url, d.type as DocumentType)),
        );
    }

    private toOrm(feature: Feature): FeatureOrmEntity {
        const e = new FeatureOrmEntity();
        e.id = feature.getId().getValue();
        e.ownerType = feature.getOwner().getType();
        e.ownerId = feature.getOwner().getId();
        e.number = feature.getNumber();
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
