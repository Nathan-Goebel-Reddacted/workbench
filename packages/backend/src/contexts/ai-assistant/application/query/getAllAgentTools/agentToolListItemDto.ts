import { AgentToolDto } from '../getAgentToolById/agentToolDto';

export type AgentToolListItemDto = AgentToolDto & Readonly<{ ownerName: string | null }>;
