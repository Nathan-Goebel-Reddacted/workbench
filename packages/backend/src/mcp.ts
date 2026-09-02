import { MikroORM } from '@mikro-orm/postgresql';
import { RequestContext } from '@mikro-orm/core';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import config from './shared/infrastructure/mikro-orm.config.js';
import { bootstrap } from './bootstrap.js';
import { createMcpServer } from './contexts/ai-assistant/infrastructure/mcp/mcpServerFactory.js';
import { pairInteractively } from './contexts/ai-assistant/infrastructure/mcp/pairingClient.js';

import { StderrLogger } from './shared/infrastructure/logging/stderrLogger.js';

// stdout carries the JSON-RPC stream: every diagnostic must go to stderr.
const logger = new StderrLogger('mcp');
const log = (message: string) => logger.info(message);

const AGENT_NAME = process.env.AGENT_NAME ?? 'claude-code';
const AGENT_SCOPES = (process.env.AGENT_SCOPES ?? 'project,feature,ticket,idea,portfolio').split(',');
const AGENT_PERMISSION = process.env.AGENT_PERMISSION ?? 'read_write';
const API_URL = process.env.APP_URL ?? 'http://localhost:3000';

try {
    const orm = await MikroORM.init(config);
    const { toolRegistry, agentAuthenticator } = bootstrap(orm.em, logger);

    let token = process.env.AGENT_TOOL_TOKEN;

    if (!token) {
        log('no AGENT_TOOL_TOKEN configured, starting pairing…');
        token = await pairInteractively({
            apiUrl: API_URL,
            name: AGENT_NAME,
            scopes: AGENT_SCOPES,
            permission: AGENT_PERMISSION,
            onCode: code => {
                log('');
                log(`  pairing code: ${code}`);
                log('  approve it in the admin screen, under "Demandes d\'accès".');
                log('');
            },
        });
        log('paired. Set AGENT_TOOL_TOKEN to this value to skip pairing next time:');
        log(token);
    }

    const agent = await agentAuthenticator.authenticate(token);
    if (!agent) {
        log('token was rejected. Remove AGENT_TOOL_TOKEN to pair again.');
        await orm.close();
        process.exit(1);
    }

    // Unlike the HTTP transport, this process is long-lived: each call gets its own ORM
    // context so entities loaded by one tool never leak into the next.
    const server = createMcpServer(toolRegistry, agent, operation => RequestContext.create(orm.em, operation));

    await server.connect(new StdioServerTransport());
    log(`serving ${toolRegistry.listFor(agent).length} tools as "${agent.getName().getValue()}"`);

    const shutdown = async () => {
        await server.close();
        await orm.close();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
} catch (err) {
    log(`failed to start: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
}
