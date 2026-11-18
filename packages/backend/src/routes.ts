import { FastifyInstance } from 'fastify';
import { MikroORM } from '@mikro-orm/postgresql';
import { CommandBus } from './shared/application/command/commandBus.js';
import { QueryBus } from './shared/application/query/queryBus.js';
import { ToolRegistry } from './contexts/ai-assistant/application/tool/toolRegistry.js';
import { AgentAuthenticator } from './contexts/ai-assistant/application/auth/agentAuthenticator.js';
import { authRoutes } from './contexts/auth/infrastructure/http/authRoutes.js';
import { userRoutes } from './contexts/user/infrastructure/http/userRoutes.js';
import { portfolioRoutes } from './contexts/portfolio/infrastructure/http/portfolioRoutes.js';
import { projectRoutes } from './contexts/project/infrastructure/http/projectRoutes.js';
import { featureRoutes } from './contexts/feature/infrastructure/http/featureRoutes.js';
import { referenceRoutes } from './contexts/reference/infrastructure/http/referenceRoutes.js';
import { ticketRoutes } from './contexts/ticket/infrastructure/http/ticketRoutes.js';
import { ideaRoutes } from './contexts/idea/infrastructure/http/ideaRoutes.js';
import { contentEditorRoutes } from './contexts/contentEditor/infrastructure/http/contentEditorRoutes.js';
import { pageRoutes } from './contexts/contentEditor/infrastructure/http/pageRoutes.js';
import { agentToolRoutes } from './contexts/ai-assistant/infrastructure/http/agentToolRoutes.js';
import { contactRoutes } from './contexts/contact/infrastructure/http/contactRoutes.js';
import { cvRoutes } from './contexts/cv/infrastructure/http/cvRoutes.js';
import { mcpRoutes } from './contexts/ai-assistant/infrastructure/mcp/mcpRoutes.js';
import { pairingRoutes } from './contexts/ai-assistant/infrastructure/http/pairingRoutes.js';
import { themeRoutes } from './contexts/theme/infrastructure/http/themeRoutes.js';
import { uploadRoutes } from './shared/infrastructure/http/uploadRoutes.js';
import { ioRoutes } from './shared/infrastructure/http/ioRoutes.js';
import { errorLogRoutes } from './contexts/errorLog/infrastructure/http/errorLogRoutes.js';
import { siteRoutes } from './contexts/site/infrastructure/http/siteRoutes.js';

export type RouteBuses = {
    commandBus: CommandBus;
    queryBus: QueryBus;
    toolRegistry: ToolRegistry;
    agentAuthenticator: AgentAuthenticator;
};

export async function registerRoutes(app: FastifyInstance, buses: RouteBuses, orm: MikroORM): Promise<void> {
    await app.register(authRoutes, buses);
    await app.register(userRoutes, buses);
    await app.register(portfolioRoutes, buses);
    await app.register(projectRoutes, buses);
    await app.register(featureRoutes, buses);
    await app.register(referenceRoutes, buses);
    await app.register(ticketRoutes, buses);
    await app.register(ideaRoutes, buses);
    await app.register(contentEditorRoutes, buses);
    await app.register(pageRoutes, buses);
    await app.register(agentToolRoutes, buses);
    await app.register(cvRoutes, buses);
    // POST is public: the contact form is filled by site visitors. Reading is reserved to editors.
    await app.register(contactRoutes, buses);
    await app.register(mcpRoutes, {
        registry: buses.toolRegistry,
        authenticator: buses.agentAuthenticator,
    });
    await app.register(pairingRoutes, buses);
    await app.register(themeRoutes, buses);
    await app.register(uploadRoutes, buses);
    await app.register(ioRoutes, { orm });
    // Public en écriture : le site public n'a pas de session et ses erreurs comptent autant.
    await app.register(errorLogRoutes, buses);
    await app.register(siteRoutes, buses);
}
