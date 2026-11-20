import { describe, expect, it, vi } from 'vitest';
import Fastify from 'fastify';
import { mcpRoutes } from './mcpRoutes.js';
import type { AgentAuthenticator } from '@contexts/ai-assistant/application/auth/agentAuthenticator.js';
import type { ToolRegistry } from '@contexts/ai-assistant/application/tool/toolRegistry.js';

describe('POST /mcp', () => {
    it('refuses a caller without a valid token before reading its body', async () => {
        const app = Fastify();
        const authenticate = vi.fn(async () => null);
        await app.register(mcpRoutes, {
            registry: {} as ToolRegistry,
            authenticator: { authenticate } as unknown as AgentAuthenticator,
        });

        const res = await app.inject({
            method: 'POST',
            url: '/mcp',
            headers: { 'content-type': 'application/json', authorization: 'Bearer nope' },
            payload: '{ not json',
        });

        expect(res.statusCode).toBe(401);
        expect(authenticate).toHaveBeenCalledWith('nope');
        await app.close();
    });
});
