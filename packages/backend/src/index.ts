import { MikroORM } from '@mikro-orm/postgresql';
import { env, envWarnings } from './shared/infrastructure/config/env.js';
import config from './shared/infrastructure/mikro-orm.config.js';
import { bootstrap } from './bootstrap.js';
import { createLoggerInstance, PinoLogger } from './shared/infrastructure/logging/pinoLogger.js';
import { createServer } from './shared/infrastructure/http/server.js';
import { registerRoutes } from './routes.js';
import { bootstrapAdmin } from './contexts/auth/infrastructure/bootstrapAdmin.js';
import { GetSiteAccessQuery } from './contexts/site/application/query/getSiteAccess/getSiteAccessQuery.js';
import { SiteAccessDto } from './contexts/site/application/query/getSiteAccess/siteAccessDto.js';
import { PurgeOrphanUploadsCommand } from './shared/application/command/purgeOrphanUploads/purgeOrphanUploadsCommand.js';

const ORPHAN_UPLOAD_AGE_MS = 24 * 60 * 60 * 1000;
const ORPHAN_UPLOAD_SWEEP_EVERY_MS = 24 * 60 * 60 * 1000;

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

    const isSiteOpen = async () =>
        (await buses.queryBus.dispatch<GetSiteAccessQuery, SiteAccessDto>(new GetSiteAccessQuery())).open;
    const app = createServer(orm, buses.commandBus, loggerInstance, isSiteOpen);

    await bootstrapAdmin({
        em: orm.em,
        commandBus: buses.commandBus,
        queryBus: buses.queryBus,
        log: message => app.log.info(message),
    });

    await registerRoutes(app, buses, orm);

    for (const warning of envWarnings) app.log.warn(warning);

    await app.listen({ port: env.PORT, host: env.HOST });

    const sweepOrphanUploads = async () => {
        try {
            const purged = await buses.commandBus.dispatch<PurgeOrphanUploadsCommand, string[]>(
                new PurgeOrphanUploadsCommand(new Date(Date.now() - ORPHAN_UPLOAD_AGE_MS)),
            );
            if (purged.length > 0) logger.info('Orphan uploads purged', { purged });
        } catch (err) {
            logger.error('Orphan upload sweep failed', { error: String(err) });
        }
    };
    void sweepOrphanUploads();
    const sweepTimer = setInterval(() => void sweepOrphanUploads(), ORPHAN_UPLOAD_SWEEP_EVERY_MS);
    sweepTimer.unref();

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
