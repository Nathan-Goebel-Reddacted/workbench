import { MikroORM } from '@mikro-orm/postgresql';
import { env, envWarnings } from './shared/infrastructure/config/env.js';
import config from './shared/infrastructure/mikro-orm.config.js';
import { bootstrap } from './bootstrap.js';
import { createLoggerInstance, PinoLogger } from './shared/infrastructure/logging/pinoLogger.js';
import { createServer } from './shared/infrastructure/http/server.js';
import { authRoutes } from './contexts/auth/infrastructure/http/authRoutes.js';
import { bootstrapAdmin } from './contexts/auth/infrastructure/bootstrapAdmin.js';
import { userRoutes } from './contexts/user/infrastructure/http/userRoutes.js';
import { portfolioRoutes } from './contexts/portfolio/infrastructure/http/portfolioRoutes.js';
import { projectRoutes } from './contexts/project/infrastructure/http/projectRoutes.js';
import { featureRoutes } from './contexts/feature/infrastructure/http/featureRoutes.js';
import { referenceRoutes } from './contexts/reference/infrastructure/http/referenceRoutes.js';
import { ticketRoutes } from './contexts/ticket/infrastructure/http/ticketRoutes.js';
import { ideaRoutes } from './contexts/idea/infrastructure/http/ideaRoutes.js';
import { contentEditorRoutes } from './contexts/contentEditor/infrastructure/http/contentEditorRoutes.js';
import { agentToolRoutes } from './contexts/ai-assistant/infrastructure/http/agentToolRoutes.js';
import { contactRoutes } from './contexts/contact/infrastructure/http/contactRoutes.js';
import { cvRoutes } from './contexts/cv/infrastructure/http/cvRoutes.js';
import { mcpRoutes } from './contexts/ai-assistant/infrastructure/mcp/mcpRoutes.js';
import { pairingRoutes } from './contexts/ai-assistant/infrastructure/http/pairingRoutes.js';
import { AgentPairingRequestRepository } from './contexts/ai-assistant/infrastructure/repository/agentPairingRequestRepository.js';
import { themeRoutes } from './contexts/theme/infrastructure/http/themeRoutes.js';
import { uploadRoutes } from './shared/infrastructure/http/uploadRoutes.js';
import { ioRoutes } from './shared/infrastructure/http/ioRoutes.js';
import { errorLogRoutes } from './contexts/errorLog/infrastructure/http/errorLogRoutes.js';

try {
    // Le logger d'abord : tout le reste peut avoir besoin de journaliser, y compris
    // l'échec de son propre démarrage.
    const loggerInstance = createLoggerInstance(env.LOG_LEVEL);
    const logger = new PinoLogger(loggerInstance);

    const orm = await MikroORM.init(config);

    // Les bus ensuite : le gestionnaire d'erreurs du serveur consigne les pannes par le bus,
    // il lui faut donc des bus déjà montés. Le cycle d'autrefois — journal, puis serveur,
    // puis bus — est rompu par le logger autonome ci-dessus.
    const buses = bootstrap(orm.em, logger);

    const app = createServer(orm, buses.commandBus, loggerInstance);

    await bootstrapAdmin({
        em: orm.em,
        commandBus: buses.commandBus,
        queryBus: buses.queryBus,
        log: message => app.log.info(message),
    });

    await app.register(authRoutes, buses);
    await app.register(userRoutes, buses);
    await app.register(portfolioRoutes, buses);
    await app.register(projectRoutes, buses);
    await app.register(featureRoutes, buses);
    await app.register(referenceRoutes, buses);
    await app.register(ticketRoutes, buses);
    await app.register(ideaRoutes, buses);
    await app.register(contentEditorRoutes, buses);
    await app.register(agentToolRoutes, buses);
    await app.register(cvRoutes, buses);
    // POST is public: the contact form is filled by site visitors. Reading is reserved to editors.
    await app.register(contactRoutes, buses);
    await app.register(mcpRoutes, {
        registry: buses.toolRegistry,
        authenticator: buses.agentAuthenticator,
    });
    await app.register(pairingRoutes, {
        commandBus: buses.commandBus,
        pairingRepo: new AgentPairingRequestRepository(orm.em),
    });
    await app.register(themeRoutes, buses);
    await app.register(uploadRoutes);
    await app.register(ioRoutes, { orm });
    // Public en écriture : le site public n'a pas de session et ses erreurs comptent autant.
    await app.register(errorLogRoutes, buses);

    for (const warning of envWarnings) app.log.warn(warning);

    await app.listen({ port: env.PORT, host: env.HOST });

    process.on('SIGTERM', async () => {
        await app.close();
        await orm.close();
    });
    process.on('SIGINT', async () => {
        await app.close();
        await orm.close();
    });
} catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
}
