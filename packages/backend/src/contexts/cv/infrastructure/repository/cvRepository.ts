import { EntityManager } from '@mikro-orm/postgresql';
import { ICvRepository } from '../../domain/repository/iCvRepository';
import { Cv } from '../../domain/cvAggregate';
import { CvOrmEntity } from '../entity/cvOrmEntity';
import { CvFactory } from '../../domain/factory/cvFactory';
import { CvId } from '../../domain/valueObject/cvId';

export class CvRepository implements ICvRepository {
    private readonly factory = new CvFactory();

    constructor(private readonly em: EntityManager) {}

    async findAll(): Promise<Cv[]> {
        const entities = await this.em.find(CvOrmEntity, {}, { orderBy: { displayOrder: 'asc' } });
        return entities.map(e => this.toDomain(e));
    }

    async findById(id: CvId): Promise<Cv | null> {
        const e = await this.em.findOne(CvOrmEntity, { id: id.getValue() });
        return e ? this.toDomain(e) : null;
    }

    async save(cv: Cv): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(CvOrmEntity, this.toOrm(cv));
        });
    }

    async saveAll(cvs: Cv[]): Promise<void> {
        if (cvs.length === 0) return;
        await this.em.transactional(async em => {
            await em.upsertMany(
                CvOrmEntity,
                cvs.map(cv => this.toOrm(cv)),
            );
        });
    }

    async delete(id: CvId): Promise<void> {
        await this.em.transactional(async em => {
            await em.nativeDelete(CvOrmEntity, { id: id.getValue() });
        });
    }

    async nextDisplayOrder(): Promise<number> {
        const [last] = await this.em.find(CvOrmEntity, {}, { orderBy: { displayOrder: 'desc' }, limit: 1 });
        return last ? last.displayOrder + 1 : 0;
    }

    private toDomain(e: CvOrmEntity): Cv {
        return this.factory.rehydrate(e.id, e.name, e.fileUrl, e.visible, e.displayOrder, e.createdAt);
    }

    private toOrm(cv: Cv): CvOrmEntity {
        const e = new CvOrmEntity();
        e.id = cv.getId().getValue();
        e.name = cv.getName().getValue();
        e.fileUrl = cv.getFileUrl().getValue();
        e.visible = cv.isVisible();
        e.displayOrder = cv.getDisplayOrder();
        e.createdAt = cv.getCreatedAt();
        return e;
    }
}
