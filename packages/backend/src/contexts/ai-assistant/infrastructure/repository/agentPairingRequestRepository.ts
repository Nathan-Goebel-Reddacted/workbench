import bcrypt from 'bcrypt';
import { EntityManager } from '@mikro-orm/postgresql';
import { AgentPairingRequestOrmEntity, PairingStatus } from '../entity/agentPairingRequestOrmEntity';
import { pairingCodePrefix } from '../../application/auth/pairingCode';

/** What the admin screen may see: the prefix identifies a request, the full code never leaves the agent. */
export type PairingRequestView = Readonly<{
    id: string;
    name: string;
    requestedScopes: string[];
    requestedPermission: string;
    codePrefix: string;
    status: PairingStatus;
    expiresAt: Date;
    createdAt: Date;
}>;

/** Cap on simultaneously pending requests: nobody can authenticate to create one. */
export const MAX_PENDING_REQUESTS = 20;

/**
 * Volontairement pas une `DomainException` : celle-ci signifie « règle métier refusée », que
 * le gestionnaire d'erreurs rend en 400. Ici la demande est valide, c'est la file qui est
 * pleine — cela se répond 429, et la route s'en charge. En faire une DomainException la
 * ferait silencieusement basculer en 400 le jour où ce rattrapage disparaîtrait.
 */
export class TooManyPendingPairingRequests extends Error {
    constructor() {
        super('Too many pending pairing requests');
    }
}

export class AgentPairingRequestRepository {
    constructor(private readonly em: EntityManager) {}

    async create(name: string, scopes: string[], permission: string, code: string, expiresAt: Date): Promise<string> {
        await this.purgeExpired();

        const pending = await this.em.count(AgentPairingRequestOrmEntity, { status: 'pending' });
        if (pending >= MAX_PENDING_REQUESTS) {
            throw new TooManyPendingPairingRequests();
        }

        const id = crypto.randomUUID();
        const entity = this.em.create(AgentPairingRequestOrmEntity, {
            id,
            name,
            requestedScopes: scopes,
            requestedPermission: permission,
            codeHash: await bcrypt.hash(code, 12),
            codePrefix: pairingCodePrefix(code),
            status: 'pending',
            expiresAt,
            createdAt: new Date(),
        });
        await this.em.persistAndFlush(entity);
        return id;
    }

    async findById(id: string): Promise<AgentPairingRequestOrmEntity | null> {
        return this.em.findOne(AgentPairingRequestOrmEntity, { id });
    }

    /**
     * Resolves a presented code. The clear prefix narrows the search to a handful of rows,
     * then bcrypt confirms the full code — the hash alone could never be looked up.
     */
    async findByCode(code: string): Promise<AgentPairingRequestOrmEntity | null> {
        const candidates = await this.em.find(AgentPairingRequestOrmEntity, {
            codePrefix: pairingCodePrefix(code),
        });

        for (const candidate of candidates) {
            if (await bcrypt.compare(code, candidate.codeHash)) return candidate;
        }
        return null;
    }

    async listPending(): Promise<PairingRequestView[]> {
        await this.purgeExpired();

        const rows = await this.em.find(
            AgentPairingRequestOrmEntity,
            { status: { $in: ['pending', 'approved'] } },
            { orderBy: { createdAt: 'desc' } },
        );

        return rows.map(row => ({
            id: row.id,
            name: row.name,
            requestedScopes: row.requestedScopes,
            requestedPermission: row.requestedPermission,
            codePrefix: row.codePrefix,
            status: row.status,
            expiresAt: row.expiresAt,
            createdAt: row.createdAt,
        }));
    }

    async approve(id: string, agentToolId: string): Promise<void> {
        const entity = await this.em.findOneOrFail(AgentPairingRequestOrmEntity, { id });
        entity.status = 'approved';
        entity.agentToolId = agentToolId;
        await this.em.flush();
    }

    async setStatus(id: string, status: PairingStatus): Promise<void> {
        const entity = await this.em.findOneOrFail(AgentPairingRequestOrmEntity, { id });
        entity.status = status;
        await this.em.flush();
    }

    private async purgeExpired(): Promise<void> {
        await this.em.nativeDelete(AgentPairingRequestOrmEntity, {
            status: 'pending',
            expiresAt: { $lt: new Date() },
        });
    }
}
