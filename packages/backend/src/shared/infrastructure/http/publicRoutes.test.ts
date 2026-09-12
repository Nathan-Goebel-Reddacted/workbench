import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MikroORM } from '@mikro-orm/postgresql';
import { CommandBus } from '@shared/application/command/commandBus.js';
import pino from 'pino';
import type { FastifyBaseLogger } from 'fastify';

// Le garde de session ne lit plus une liste d'URLs mais le `config.public` de chaque route.
// Ce qui se joue ici : une mutation publique reste atteignable sans session, une mutation
// ordinaire ne l'est pas, et les fichiers uploadés — dont le plugin statique écrase le
// `config` — sont bien estampillés par le hook `onRoute`.

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

const orm = { em: {} } as unknown as MikroORM;
const commandBus = new CommandBus();

let createServer: (orm: MikroORM, commandBus: CommandBus, logger: FastifyBaseLogger) => FastifyInstance;

async function server(): Promise<FastifyInstance> {
    const app = createServer(orm, commandBus, pino({ level: 'silent' }) as unknown as FastifyBaseLogger);
    app.post('/public-write', { config: { public: true } }, async () => ({ reached: true }));
    app.post('/guarded-write', async () => ({ reached: true }));
    // `@fastify/jwt` décore la requête : `user` existe et vaut `null` tant qu'aucun jeton
    // n'a été vérifié. L'absence de session se lit donc sur la valeur, pas sur la propriété.
    app.get('/guarded-read', async req => ({ anonymous: !req.user }));
    await app.ready();
    return app;
}

beforeAll(async () => {
    ({ createServer } = await import('./server.js'));
});

describe('garde de session piloté par config.public', () => {
    it('laisse passer une mutation publique sans session', async () => {
        const app = await server();
        const res = await app.inject({ method: 'POST', url: '/public-write' });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ reached: true });
        await app.close();
    });

    it('refuse une mutation ordinaire sans session', async () => {
        const app = await server();
        const res = await app.inject({ method: 'POST', url: '/guarded-write' });

        expect(res.statusCode).toBe(401);
        expect(res.json()).toEqual({ error: 'Unauthorized' });
        await app.close();
    });

    it('laisse une lecture ordinaire se poursuivre en anonyme', async () => {
        const app = await server();
        const res = await app.inject({ method: 'GET', url: '/guarded-read' });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ anonymous: true });
        await app.close();
    });

    it('sert /health sans session', async () => {
        const app = createServer(orm, commandBus, pino({ level: 'silent' }) as unknown as FastifyBaseLogger);
        // La sonde interroge la base ; ici elle est absente, donc 503 — mais 503 prouve
        // déjà que le garde ne s'est pas interposé, ce qui est tout ce qu'on vérifie.
        (orm as unknown as { em: { getConnection: () => unknown } }).em = {
            getConnection: () => ({
                execute: () => {
                    throw new Error('no database in this test');
                },
            }),
        };
        await app.ready();
        const res = await app.inject({ method: 'GET', url: '/health' });

        expect(res.statusCode).toBe(503);
        await app.close();
    });

    it('sert les fichiers uploadés sans session — le plugin statique écrase config, le hook onRoute le réinstalle', async () => {
        const app = await server();
        const res = await app.inject({ method: 'GET', url: '/uploads/.gitkeep' });

        // 200 si le fichier est là, 404 si le dossier est vide : dans les deux cas le garde
        // a été contourné. Un 401 signifierait que l'estampillage `onRoute` n'a pas pris.
        expect([200, 404]).toContain(res.statusCode);
        await app.close();
    });
});
