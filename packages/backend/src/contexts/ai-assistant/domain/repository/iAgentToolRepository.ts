import { AgentTool } from '../agentToolAggregate';
import { AgentToolId } from '../valueObject/agentToolId';
import { UserId } from '../valueObject/userId';

export interface IAgentToolRepository {
    findById(id: AgentToolId): Promise<AgentTool | null>;
    findByUserId(userId: UserId): Promise<AgentTool[]>;
    findAll(): Promise<AgentTool[]>;
    save(agentTool: AgentTool): Promise<void>;
}
