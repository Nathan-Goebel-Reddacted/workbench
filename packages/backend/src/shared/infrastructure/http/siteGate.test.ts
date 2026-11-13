import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type { MikroORM } from '@mikro-orm/postgresql';
import pino from 'pino';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { RecordErrorLogEntryCommand } from '@contexts/errorLog/application/command/recordErrorLogEntry/recordErrorLogEntryCommand.js';
import { ListVisibleThemesQuery } from '@contexts/theme/application/query/listVisibleThemes/listVisibleThemesQuery.js';
import { GetSiteAccessQuery } from '@contexts/site/application/query/getSiteAccess/getSiteAccessQuery.js';

// Site fermé, un appelant sans lecture privée ne reçoit plus rien — sauf de quoi se connecter
// pour le rouvrir. Une session privée, elle, voit le site comme s'il était ouvert.

vi.mock('@mikro-orm/core', async importOriginal => {
    const actual = await importOriginal<typeof import('@mikro-orm/core')>();
    return {
        ...actual,
        RequestContext: { create: (_em: unknown, done: () => void) => done() },
    };
});

process.env.LOG_LEVEL = 'fatal';
process.env.JWT_SECRET ??= '0'.repeat(64);
process.env.APP_URL ??= 'http://localhost:3000';
process.env.FRONTEND_PUBLIC_URL ??= 'http://localhost:5173';
process.env.FRONTEND_PRIVATE_URL ??= 'http://localhost:5174';

const silentLogger = pino({ level: 'silent' }) as unknown as FastifyBaseLogger;
const orm = { em: { findOne: async () => ({ tokenVersion: 1 }) } } as unknown as MikroORM;

type Routes = typeof import('@contexts/site/infrastructure/http/siteRoutes.js').siteRoutes;

let createServer: (
    orm: MikroORM,
    commandBus: CommandBus,
    logger: FastifyBaseLogger,
    isSiteOpen: () => Promise<boolean>,
) => FastifyInstance;
let plugins: Routes[];

function buses(open: boolean) {
    const commandBus = new CommandBus();
    const recorded: RecordErrorLogEntryCommand[] = [];
    commandBus.register(RecordErrorLogEntryCommand.commandName, {
        handle: async (command: RecordErrorLogEntryCommand) => void recorded.push(command),
    });
    const queryBus = new QueryBus();
    queryBus.register(ListVisibleThemesQuery.queryName, { handle: async () => ({ themes: [], defaultId: null }) });
    queryBus.register(GetSiteAccessQuery.queryName, { handle: async () => ({ open }) });
    return { commandBus, queryBus, recorded };
}

async function server(isSiteOpen: () => Promise<boolean>, open = false) {
    const { commandBus, queryBus, recorded } = buses(open);
    const app = createServer(orm, commandBus, silentLogger, isSiteOpen);
    app.get('/content', async () => ({ reached: true }));
    app.post('/contact-like', { config: { public: true } }, async () => ({ reached: true }));
    for (const plugin of plugins) await app.register(plugin, { commandBus, queryBus });
    await app.ready();
    return { app, recorded };
}

const closed = async () => false;

function sessionCookie(app: FastifyInstance, roles = ['view'], tv = 1): string {
    return `session=${app.jwt.sign({ sub: 'u1', email: 'a@b.c', roles, tv })}`;
}

beforeAll(async () => {
    ({ createServer } = await import('./server.js'));
    plugins = [
        (await import('@contexts/auth/infrastructure/http/authRoutes.js')).authRoutes,
        (await import('@contexts/theme/infrastructure/http/themeRoutes.js')).themeRoutes,
        (await import('@contexts/errorLog/infrastructure/http/errorLogRoutes.js')).errorLogRoutes,
        (await import('@contexts/site/infrastructure/http/siteRoutes.js')).siteRoutes,
    ] as Routes[];
});

describe('site public fermé', () => {
    it('refuse le contenu à un anonyme, avec le message que la popup affichera', async () => {
        const { app } = await server(closed);
        const res = await app.inject({ method: 'GET', url: '/content' });

        expect(res.statusCode).toBe(503);
        expect(res.json()).toEqual({ error: 'Site closed', message: 'Site en maintenance' });
        await app.close();
    });

    it('refuse les fichiers uploadés et les écritures publiques à un anonyme', async () => {
        const { app } = await server(closed);

        expect((await app.inject({ method: 'GET', url: '/uploads/.gitkeep' })).statusCode).toBe(503);
        expect((await app.inject({ method: 'POST', url: '/contact-like' })).statusCode).toBe(503);
        await app.close();
    });

    it('sert le contenu et les fichiers à une session privée', async () => {
        const { app } = await server(closed);
        const cookie = sessionCookie(app);

        expect((await app.inject({ method: 'GET', url: '/content', headers: { cookie } })).statusCode).toBe(200);
        const upload = await app.inject({ method: 'GET', url: '/uploads/.gitkeep', headers: { cookie } });
        expect([200, 404]).toContain(upload.statusCode);
        await app.close();
    });

    it('traite une session périmée en anonyme', async () => {
        const { app } = await server(closed);
        const cookie = sessionCookie(app, ['view'], 0);

        expect((await app.inject({ method: 'GET', url: '/content', headers: { cookie } })).statusCode).toBe(503);
        await app.close();
    });

    it('ferme quand le réglage est illisible, sans rien consigner', async () => {
        const { app, recorded } = await server(async () => {
            throw new Error('database down');
        });
        const res = await app.inject({ method: 'GET', url: '/content' });

        expect(res.statusCode).toBe(503);
        expect(recorded).toEqual([]);
        await app.close();
    });

    it('laisse un anonyme mener le parcours de connexion', async () => {
        const { app } = await server(closed);

        expect((await app.inject({ method: 'GET', url: '/themes' })).statusCode).toBe(200);
        expect((await app.inject({ method: 'GET', url: '/auth/me' })).statusCode).toBe(401);
        expect((await app.inject({ method: 'GET', url: '/auth/providers' })).statusCode).toBe(200);
        const roleless = sessionCookie(app, []);
        const logout = await app.inject({ method: 'POST', url: '/auth/logout', headers: { cookie: roleless } });
        expect(logout.statusCode).toBe(204);
        const report = await app.inject({ method: 'POST', url: '/error-log', payload: { message: 'boom' } });
        expect(report.statusCode).toBe(204);
        await app.close();
    });

    it('dit à chacun si le site lui est servi', async () => {
        const { app } = await server(closed);

        const anonymous = await app.inject({ method: 'GET', url: '/site-access' });
        expect(anonymous.json()).toEqual({ open: false, served: false });
        expect(anonymous.headers['cache-control']).toBe('no-store');

        const cookie = sessionCookie(app);
        const signedIn = await app.inject({ method: 'GET', url: '/site-access', headers: { cookie } });
        expect(signedIn.json()).toEqual({ open: false, served: true });
        await app.close();
    });
});

describe('site public ouvert', () => {
    it('sert le contenu à un anonyme', async () => {
        const { app } = await server(async () => true, true);

        expect((await app.inject({ method: 'GET', url: '/content' })).statusCode).toBe(200);
        expect((await app.inject({ method: 'GET', url: '/site-access' })).json()).toEqual({ open: true, served: true });
        await app.close();
    });
});

describe('PATCH /site-access', () => {
    it('refuse un anonyme, un lecteur et un corps invalide', async () => {
        const { app } = await server(async () => true, true);
        const patch = (payload: unknown, cookie?: string) =>
            app.inject({
                method: 'PATCH',
                url: '/site-access',
                payload: payload as object,
                headers: cookie ? { cookie } : {},
            });

        expect((await patch({ open: true })).statusCode).toBe(401);
        expect((await patch({ open: true }, sessionCookie(app))).statusCode).toBe(403);
        expect((await patch({ open: 'yes' }, sessionCookie(app, ['edit']))).statusCode).toBe(400);
        await app.close();
    });
});
