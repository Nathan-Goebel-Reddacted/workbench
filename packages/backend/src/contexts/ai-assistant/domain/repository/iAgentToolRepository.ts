import { AgentTool } from "../agentToolAggregate";

export interface IAgentToolRepository {
    findById(id: string): Promise<AgentTool | null>;
    findByUserId(userId: string): Promise<AgentTool[]>;
    save(agentTool: AgentTool): Promise<void>;
}
