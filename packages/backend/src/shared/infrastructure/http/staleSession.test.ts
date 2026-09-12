import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type { MikroORM } from '@mikro-orm/postgresql';
import pino from 'pino';
import { CommandBus } from '@shared/application/command/commandBus.js';

// Un cookie de session périmé — rôle retiré, déconnexion globale, compte supprimé — doit
// être effacé, sans quoi le navigateur le renvoie indéfiniment et chaque requête repaie une
// lecture en base pour reconstater la même chose.
//
// Mais il ne doit PAS produire un 401 sur une lecture : `ThemeProvider` interroge
// `GET /themes` avec `credentials: 'include'` depuis les DEUX frontends. Un visiteur du site
// public ayant un jour eu une session ici perdrait son thème. C'est le scénario que ce
// fichier protège.

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

let createServer: (orm: MikroORM, commandBus: CommandBus, logger: FastifyBaseLogger) => FastifyInstance;

/** `tokenVersion` en base — c'est elle qui décide si un jeton signé plus tôt vaut encore. */
function ormWithTokenVersion(stored: number | null): MikroORM {
    return {
        em: { findOne: async () => (stored === null ? null : { tokenVersion: stored }) },
    } as unknown as MikroORM;
}

async function server(orm: MikroORM): Promise<FastifyInstance> {
    const app = createServer(orm, new CommandBus(), silentLogger);
    app.get('/read', async req => ({ signedIn: Boolean(req.user) }));
    app.post('/write', async () => ({ reached: true }));
    await app.ready();
    return app;
}

/** Un jeton réellement signé par l'instance, porteur de la version de session donnée. */
async function sessionCookie(app: FastifyInstance, tv: number): Promise<string> {
    const token = app.jwt.sign({ sub: 'u1', email: 'a@b.c', roles: ['view'], tv });
    return `session=${token}`;
}

function clearsTheCookie(res: { headers: Record<string, unknown> }): boolean {
    const header = res.headers['set-cookie'];
    const values = Array.isArray(header) ? header : [header];
    return values.some(value => typeof value === 'string' && /^session=;/.test(value));
}

beforeAll(async () => {
    ({ createServer } = await import('./server.js'));
});

describe('cookie de session périmé', () => {
    it('laisse la lecture se poursuivre en anonyme plutôt que de rendre 401', async () => {
        // Le jeton dit v1, la base dit v2 : la session a été coupée entre-temps.
        const app = await server(ormWithTokenVersion(2));
        const cookie = await sessionCookie(app, 1);

        const res = await app.inject({ method: 'GET', url: '/read', headers: { cookie } });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ signedIn: false });
        await app.close();
    });

    it('efface le cookie pour que le navigateur cesse de le présenter', async () => {
        const app = await server(ormWithTokenVersion(2));
        const cookie = await sessionCookie(app, 1);

        const res = await app.inject({ method: 'GET', url: '/read', headers: { cookie } });

        expect(clearsTheCookie(res)).toBe(true);
        await app.close();
    });

    it('refuse la mutation en 401', async () => {
        const app = await server(ormWithTokenVersion(2));
        const cookie = await sessionCookie(app, 1);

        const res = await app.inject({ method: 'POST', url: '/write', headers: { cookie } });

        expect(res.statusCode).toBe(401);
        expect(res.json()).toEqual({ error: 'Session revoked' });
        expect(clearsTheCookie(res)).toBe(true);
        await app.close();
    });

    it('traite de même un compte supprimé', async () => {
        const app = await server(ormWithTokenVersion(null));
        const cookie = await sessionCookie(app, 0);

        const res = await app.inject({ method: 'POST', url: '/write', headers: { cookie } });

        expect(res.statusCode).toBe(401);
        expect(clearsTheCookie(res)).toBe(true);
        await app.close();
    });

    it('efface aussi un cookie illisible', async () => {
        const app = await server(ormWithTokenVersion(0));

        const res = await app.inject({
            method: 'GET',
            url: '/read',
            headers: { cookie: 'session=ceci-nest-pas-un-jeton' },
        });

        expect(res.statusCode).toBe(200);
        expect(clearsTheCookie(res)).toBe(true);
        await app.close();
    });
});

describe('session valide', () => {
    it('passe la lecture et la mutation sans toucher au cookie', async () => {
        const app = await server(ormWithTokenVersion(3));
        const cookie = await sessionCookie(app, 3);

        const read = await app.inject({ method: 'GET', url: '/read', headers: { cookie } });
        const write = await app.inject({ method: 'POST', url: '/write', headers: { cookie } });

        expect(read.json()).toEqual({ signedIn: true });
        expect(write.statusCode).toBe(200);
        expect(clearsTheCookie(read)).toBe(false);
        await app.close();
    });
});

describe('aucun cookie', () => {
    it('lit en anonyme sans rien effacer', async () => {
        const app = await server(ormWithTokenVersion(0));

        const res = await app.inject({ method: 'GET', url: '/read' });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ signedIn: false });
        expect(clearsTheCookie(res)).toBe(false);
        await app.close();
    });

    it('refuse la mutation en 401', async () => {
        const app = await server(ormWithTokenVersion(0));

        const res = await app.inject({ method: 'POST', url: '/write' });

        expect(res.statusCode).toBe(401);
        await app.close();
    });
});
