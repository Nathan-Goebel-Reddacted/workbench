import { describe, expect, it } from 'vitest';
import { GetAllAgentToolsHandler } from './getAllAgentToolsHandler.js';
import { AgentToolFactory } from '../../../domain/factory/agentToolFactory.js';
import type { AgentTool } from '../../../domain/agentToolAggregate.js';
import type { ISecretHasher } from '../../../domain/port/iSecretHasher.js';
import type { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository.js';
import type { IUserDirectory } from '../../../domain/port/iUserDirectory.js';

const KNOWN_USER = '11111111-1111-4111-8111-111111111111';
const GONE_USER = '22222222-2222-4222-8222-222222222222';

const hasher: ISecretHasher = {
    hash: async secret => `hashed:${secret}`,
    matches: async (candidate, hashed) => hashed === `hashed:${candidate}`,
};

function repository(tools: AgentTool[]): IAgentToolRepository {
    return {
        findById: async () => null,
        findByUserId: async () => [],
        findAll: async () => tools,
        save: async () => {},
    };
}

const directory: IUserDirectory = {
    displayNames: async () => new Map([[KNOWN_USER, 'Ada Lovelace']]),
};

async function tool(id: string, userId: string): Promise<AgentTool> {
    return new AgentToolFactory(hasher).create(id, userId, 'Agent', 'read', ['project'], 'raw-token');
}

describe('GetAllAgentToolsHandler', () => {
    it('nomme le propriétaire de chaque agent, ou null s’il a disparu', async () => {
        const known = await tool('33333333-3333-4333-8333-333333333333', KNOWN_USER);
        const orphan = await tool('44444444-4444-4444-8444-444444444444', GONE_USER);

        const result = await new GetAllAgentToolsHandler(repository([known, orphan]), directory).handle();

        expect(result.map(item => item.ownerName)).toEqual(['Ada Lovelace', null]);
    });
});
