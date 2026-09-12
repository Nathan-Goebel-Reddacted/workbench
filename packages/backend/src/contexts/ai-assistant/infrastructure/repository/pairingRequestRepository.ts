import { EntityManager } from '@mikro-orm/postgresql';
import { IPairingRequestRepository } from '../../domain/repository/iPairingRequestRepository';
import { PairingRequest } from '../../domain/pairingRequestAggregate';
import { AgentPairingRequestOrmEntity } from '../entity/agentPairingRequestOrmEntity';
import { PairingRequestId } from '../../domain/valueObject/pairingRequestId';
import { AgentToolId } from '../../domain/valueObject/agentToolId';
import { Name } from '../../domain/valueObject/name';
import { Permission } from '../../domain/valueObject/permission';
import { Scope } from '../../domain/valueObject/scope';
import { PairingCode } from '../../domain/valueObject/pairingCode';
import { PairingStatusValue } from '../../domain/valueObject/pairingStatus';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';

export class PairingRequestRepository implements IPairingRequestRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: PairingRequestId): Promise<PairingRequest | null> {
        const entity = await this.em.findOne(AgentPairingRequestOrmEntity, { id: id.getValue() });
        return entity ? this.toDomain(entity) : null;
    }

    async findByCodePrefix(prefix: string): Promise<PairingRequest[]> {
        const entities = await this.em.find(AgentPairingRequestOrmEntity, { codePrefix: prefix });
        return entities.map(entity => this.toDomain(entity));
    }

    async findOpen(): Promise<PairingRequest[]> {
        const entities = await this.em.find(
            AgentPairingRequestOrmEntity,
            { status: { $in: [PairingStatusValue.PENDING, PairingStatusValue.APPROVED] } },
            { orderBy: { createdAt: 'desc' } },
        );
        return entities.map(entity => this.toDomain(entity));
    }

    async countPending(): Promise<number> {
        return this.em.count(AgentPairingRequestOrmEntity, { status: PairingStatusValue.PENDING });
    }

    async deleteExpired(): Promise<void> {
        await this.em.nativeDelete(AgentPairingRequestOrmEntity, {
            status: PairingStatusValue.PENDING,
            expiresAt: { $lt: new Date() },
        });
    }

    async save(request: PairingRequest): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(AgentPairingRequestOrmEntity, this.toOrm(request));
        });
    }

    private toDomain(entity: AgentPairingRequestOrmEntity): PairingRequest {
        return new PairingRequest(
            new PairingRequestId(entity.id),
            new Name(entity.name),
            entity.requestedScopes.map(scope => new Scope(scope)),
            new Permission(entity.requestedPermission),
            new PairingCode(entity.codeHash, entity.codePrefix),
            entity.expiresAt,
            parseEnum(entity.status, PairingStatusValue, 'pairing status'),
            entity.createdAt,
            entity.agentToolId ? new AgentToolId(entity.agentToolId) : null,
        );
    }

    private toOrm(request: PairingRequest): AgentPairingRequestOrmEntity {
        const entity = new AgentPairingRequestOrmEntity();
        entity.id = request.getId().getValue();
        entity.name = request.getName().getValue();
        entity.requestedScopes = request.getRequestedScopes().map(scope => scope.getValue());
        entity.requestedPermission = request.getRequestedPermission().getValue();
        entity.codeHash = request.getCode().getDigest();
        entity.codePrefix = request.getCode().getPrefix();
        entity.status = request.getStatus();
        entity.agentToolId = request.getAgentToolId()?.getValue();
        entity.expiresAt = request.getExpiresAt();
        entity.createdAt = request.getCreatedAt();
        return entity;
    }
}
