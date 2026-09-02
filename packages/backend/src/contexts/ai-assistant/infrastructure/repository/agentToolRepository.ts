import { EntityManager } from '@mikro-orm/postgresql';
import { IAgentToolRepository } from '../../domain/repository/iAgentToolRepository';
import { AgentTool } from '../../domain/agentToolAggregate';
import { AgentToolOrmEntity } from '../entity/agentToolOrmEntity';
import { AgentToolId } from '../../domain/valueObject/agentToolId';
import { UserId } from '../../domain/valueObject/userId';
import { Name } from '../../domain/valueObject/name';
import { Permission } from '../../domain/valueObject/permission';
import { Scope } from '../../domain/valueObject/scope';
import { Token } from '../../domain/valueObject/token';

export class AgentToolRepository implements IAgentToolRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: string): Promise<AgentTool | null> {
        const e = await this.em.findOne(AgentToolOrmEntity, { id });
        return e ? this.toDomain(e) : null;
    }

    async findByUserId(userId: string): Promise<AgentTool[]> {
        const entities = await this.em.find(AgentToolOrmEntity, { userId });
        return entities.map(e => this.toDomain(e));
    }

    async findAll(): Promise<AgentTool[]> {
        const entities = await this.em.find(AgentToolOrmEntity, {}, { orderBy: { createdAt: 'desc' } });
        return entities.map(e => this.toDomain(e));
    }

    async save(agentTool: AgentTool): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(AgentToolOrmEntity, this.toOrm(agentTool));
        });
    }

    private toDomain(e: AgentToolOrmEntity): AgentTool {
        return new AgentTool(
            new AgentToolId(e.id),
            new UserId(e.userId),
            new Name(e.name),
            new Permission(e.permission),
            e.scopes.map(s => new Scope(s)),
            new Token(e.token),
            e.createdAt,
            e.revokedAt ?? null,
        );
    }

    private toOrm(agentTool: AgentTool): AgentToolOrmEntity {
        const e = new AgentToolOrmEntity();
        e.id = agentTool.getId().getValue();
        e.userId = agentTool.getUserId().getValue();
        e.name = agentTool.getName().getValue();
        e.permission = agentTool.getPermission().getValue();
        e.scopes = agentTool.getScopes().map(s => s.getValue());
        e.token = agentTool.getToken().getValue();
        e.createdAt = agentTool.getCreatedAt();
        e.revokedAt = agentTool.getRevokedAt();
        return e;
    }
}
