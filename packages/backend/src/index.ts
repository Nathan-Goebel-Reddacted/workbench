import { MikroORM } from '@mikro-orm/postgresql';
import config from './shared/infrastructure/mikro-orm.config.js';
import { bootstrap } from './bootstrap.js';
import { createServer } from './shared/infrastructure/http/server.js';
import { authRoutes } from './contexts/auth/infrastructure/http/authRoutes.js';
import { AllowedEmailRepository } from './contexts/auth/infrastructure/repository/allowedEmailRepository.js';
import { userRoutes } from './contexts/user/infrastructure/http/userRoutes.js';
import { portfolioRoutes } from './contexts/portfolio/infrastructure/http/portfolioRoutes.js';
import { projectRoutes } from './contexts/project/infrastructure/http/projectRoutes.js';
import { featureRoutes } from './contexts/feature/infrastructure/http/featureRoutes.js';
import { ticketRoutes } from './contexts/ticket/infrastructure/http/ticketRoutes.js';
import { ideaRoutes } from './contexts/idea/infrastructure/http/ideaRoutes.js';
import { contentEditorRoutes } from './contexts/contentEditor/infrastructure/http/contentEditorRoutes.js';
import { agentToolRoutes } from './contexts/ai-assistant/infrastructure/http/agentToolRoutes.js';
import { themeRoutes } from './shared/infrastructure/http/themeRoutes.js';

if (!process.env.JWT_SECRET)           throw new Error('JWT_SECRET is required');
if (!process.env.APP_URL)              throw new Error('APP_URL is required');
if (!process.env.FRONTEND_PRIVATE_URL) throw new Error('FRONTEND_PRIVATE_URL is required');

try {
    const orm = await MikroORM.init(config);
    const buses = bootstrap(orm.em);
    const app = createServer(orm);

    const allowedEmailRepo = new AllowedEmailRepository(orm.em);
    await app.register(authRoutes, { ...buses, allowedEmailRepo });
    await app.register(userRoutes, buses);
    await app.register(portfolioRoutes, buses);
    await app.register(projectRoutes, buses);
    await app.register(featureRoutes, buses);
    await app.register(ticketRoutes, buses);
    await app.register(ideaRoutes, buses);
    await app.register(contentEditorRoutes, buses);
    await app.register(agentToolRoutes, buses);
    await app.register(themeRoutes);

    await app.listen({ port: 3000, host: '0.0.0.0' });

    process.on('SIGTERM', async () => { await app.close(); await orm.close(); });
    process.on('SIGINT',  async () => { await app.close(); await orm.close(); });
} catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
}
