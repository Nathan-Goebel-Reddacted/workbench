import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AgentTool } from '../../domain/agentToolAggregate';
import { ToolRegistry } from '../../application/tool/toolRegistry';
import { ToolContext, toolInputJsonSchema } from '../../application/tool/toolDescriptor';

const SERVER_INFO = { name: 'atelier-portfolio', version: '0.0.1' };

/**
 * Wraps a tool call. Over HTTP the ORM identity map is already scoped per request by
 * Fastify's RequestContext hook; the long-lived stdio transport passes its own wrapper
 * so that consecutive calls never share an identity map.
 */
export type ToolRunner = <T>(operation: () => Promise<T>) => Promise<T>;

const runDirectly: ToolRunner = operation => operation();

/**
 * Builds an MCP server bound to one agent: it only ever advertises and runs the tools
 * that agent is allowed to use. Shared by the HTTP and stdio transports.
 */
export function createMcpServer(registry: ToolRegistry, agent: AgentTool, run: ToolRunner = runDirectly): Server {
    const server = new Server(SERVER_INFO, { capabilities: { tools: {} } });

    const context: ToolContext = {
        agentToolId: agent.getId().getValue(),
        userId: agent.getUserId().getValue(),
    };

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: registry.listFor(agent).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: toolInputJsonSchema(tool),
        })),
    }));

    server.setRequestHandler(CallToolRequestSchema, async request => {
        const result = await run(() =>
            registry.execute(request.params.name, request.params.arguments ?? {}, agent, context),
        );

        // Tool failures are reported as tool results, not protocol errors: the model is meant to
        // read the message and correct its next call.
        if (!result.ok) {
            return {
                isError: true,
                content: [{ type: 'text', text: `${result.error.code}: ${result.error.message}` }],
            };
        }

        return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    });

    return server;
}
