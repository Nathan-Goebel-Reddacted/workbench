import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { AgentAuthenticator } from '@contexts/ai-assistant/application/auth/agentAuthenticator';
import { ToolRegistry } from '@contexts/ai-assistant/application/tool/toolRegistry';
import { createMcpServer } from './mcpServerFactory';

type Opts = { registry: ToolRegistry; authenticator: AgentAuthenticator };

function bearerToken(req: FastifyRequest): string | undefined {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice('Bearer '.length).trim() || undefined;
}

export const mcpRoutes: FastifyPluginAsync<Opts> = async (app, { registry, authenticator }) => {
    app.post('/mcp', { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } }, async (req, reply) => {
        const agent = await authenticator.authenticate(bearerToken(req));
        if (!agent) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        // Stateless: one server and one transport per request. Each request carries its own agent,
        // so nothing may be shared between calls.
        const server = createMcpServer(registry, agent);
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

        reply.raw.on('close', () => {
            void transport.close();
            void server.close();
        });

        await server.connect(transport);

        // The SDK writes the response itself, so Fastify must stop managing this reply.
        reply.hijack();
        await transport.handleRequest(req.raw, reply.raw, req.body);
    });
};
