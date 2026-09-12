import { EntityManager } from '@mikro-orm/postgresql';
import { AccessRequestOrmEntity, AccessRequestStatus as OrmStatus } from '../entity/accessRequestOrmEntity';
import { IAccessRequestRepository } from '../../domain/repository/iAccessRequestRepository';
import { AccessRequest } from '../../domain/accessRequestAggregate';
import { AccessRequestStatus } from '../../domain/valueObject/accessRequestStatus';
import { AuthEmail } from '../../domain/valueObject/email';

export class AccessRequestRepository implements IAccessRequestRepository {
    constructor(private readonly em: EntityManager) {}

    async findByEmail(email: AuthEmail): Promise<AccessRequest | null> {
        const row = await this.em.findOne(AccessRequestOrmEntity, { email: email.getValue() });
        return row ? this.toDomain(row) : null;
    }

    async findAll(): Promise<AccessRequest[]> {
        const rows = await this.em.findAll(AccessRequestOrmEntity, { orderBy: { createdAt: 'desc' } });
        return rows.map(row => this.toDomain(row));
    }

    async save(request: AccessRequest): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(AccessRequestOrmEntity, this.toOrm(request), { onConflictFields: ['email'] });
        });
    }

    private toDomain(row: AccessRequestOrmEntity): AccessRequest {
        return AccessRequest.rehydrate(
            new AuthEmail(row.email),
            row.displayName,
            row.status as AccessRequestStatus,
            row.createdAt,
            row.updatedAt,
        );
    }

    private toOrm(request: AccessRequest): AccessRequestOrmEntity {
        const row = new AccessRequestOrmEntity();
        row.email = request.getEmail().getValue();
        row.displayName = request.getDisplayName();
        row.status = request.getStatus() as OrmStatus;
        row.createdAt = request.getCreatedAt();
        row.updatedAt = request.getUpdatedAt();
        return row;
    }
}
