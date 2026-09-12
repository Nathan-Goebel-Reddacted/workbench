import { MikroORM } from '@mikro-orm/postgresql';
import { env, envWarnings } from './shared/infrastructure/config/env.js';
import config from './shared/infrastructure/mikro-orm.config.js';
import { bootstrap } from './bootstrap.js';
import { PinoLogger } from './shared/infrastructure/logging/pinoLogger.js';
import { createServer } from './shared/infrastructure/http/server.js';
import { authRoutes } from './contexts/auth/infrastructure/http/authRoutes.js';
import { AllowedEmailRepository } from './contexts/auth/infrastructure/repository/allowedEmailRepository.js';
import { AccessRequestRepository } from './contexts/auth/infrastructure/repository/accessRequestRepository.js';
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
import { themeRoutes } from './shared/infrastructure/http/themeRoutes.js';
import { uploadRoutes } from './shared/infrastructure/http/uploadRoutes.js';
import { ioRoutes } from './shared/infrastructure/http/ioRoutes.js';
import { errorLogRoutes } from './contexts/errorLog/infrastructure/http/errorLogRoutes.js';
import { ErrorLogRepository } from './contexts/errorLog/infrastructure/repository/errorLogRepository.js';
import { ErrorLogRecorder } from './contexts/errorLog/application/errorLogRecorder.js';

try {
    const orm = await MikroORM.init(config);
    // Le journal avant le serveur : le gestionnaire d'erreurs de Fastify écrit dedans.
    const errorLogRepo = new ErrorLogRepository(orm.em);
    const errorRecorder = new ErrorLogRecorder(errorLogRepo);
    // Le serveur ensuite : c'est lui qui porte le logger que reçoit tout le reste.
    const app = createServer(orm, errorRecorder);
    const buses = bootstrap(orm.em, new PinoLogger(app.log));

    const allowedEmailRepo = new AllowedEmailRepository(orm.em);
    const accessRequestRepo = new AccessRequestRepository(orm.em);

    await bootstrapAdmin({
        em: orm.em,
        commandBus: buses.commandBus,
        queryBus: buses.queryBus,
        allowedEmailRepo,
        log: message => app.log.info(message),
    });

    await app.register(authRoutes, { ...buses, allowedEmailRepo, accessRequestRepo });
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
    await app.register(themeRoutes);
    await app.register(uploadRoutes);
    await app.register(ioRoutes, { orm });
    // Public en écriture : le site public n'a pas de session et ses erreurs comptent autant.
    await app.register(errorLogRoutes, { repository: errorLogRepo, recorder: errorRecorder });

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
