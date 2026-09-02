import { EntityManager } from '@mikro-orm/postgresql';
import { AccessRequestOrmEntity, AccessRequestStatus } from '../entity/accessRequestOrmEntity';

export type AccessRequestView = Readonly<{
    email: string;
    displayName: string;
    status: AccessRequestStatus;
    createdAt: Date;
    updatedAt: Date;
}>;

export class AccessRequestRepository {
    constructor(private readonly em: EntityManager) {}

    async findAll(): Promise<AccessRequestView[]> {
        const rows = await this.em.findAll(AccessRequestOrmEntity, { orderBy: { createdAt: 'desc' } });
        return rows.map(row => ({
            email: row.email,
            displayName: row.displayName,
            status: row.status,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }));
    }

    /**
     * Records a login attempt from an email that is not whitelisted.
     *
     * Repeated attempts refresh the existing row instead of piling up, and a request that was
     * explicitly rejected is never revived: the point of rejecting is that the person stops
     * showing up in the list.
     */
    async record(email: string, displayName: string): Promise<AccessRequestStatus> {
        const existing = await this.em.findOne(AccessRequestOrmEntity, { email });

        if (!existing) {
            const entity = this.em.create(AccessRequestOrmEntity, {
                email,
                displayName,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await this.em.persistAndFlush(entity);
            return 'pending';
        }

        if (existing.status === 'rejected') return 'rejected';

        existing.displayName = displayName;
        existing.updatedAt = new Date();
        await this.em.flush();
        return existing.status;
    }

    async setStatus(email: string, status: AccessRequestStatus): Promise<boolean> {
        const existing = await this.em.findOne(AccessRequestOrmEntity, { email });
        if (!existing) return false;

        existing.status = status;
        existing.updatedAt = new Date();
        await this.em.flush();
        return true;
    }
}
