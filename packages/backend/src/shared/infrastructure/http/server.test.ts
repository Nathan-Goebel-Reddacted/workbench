import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MikroORM } from '@mikro-orm/postgresql';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import { DomainException } from '@shared/domain/domainException.js';
import type { ErrorLogRecorder } from '@contexts/errorLog/application/errorLogRecorder.js';

// Le gestionnaire d'erreurs est le seul endroit où une panne serveur devient une ligne de
// journal. Deux choses s'y jouent et ne se voient nulle part ailleurs : les erreurs *attendues*
// (404, 400) n'ont rien à y faire, et une écriture qui échoue ne doit pas changer la réponse
// déjà partie au client.

// RequestContext ouvre une unité de travail par requête : sans base, on court-circuite.
vi.mock('@mikro-orm/core', async importOriginal => {
    const actual = await importOriginal<typeof import('@mikro-orm/core')>();
    return {
        ...actual,
        RequestContext: { create: (_em: unknown, done: () => void) => done() },
    };
});

// createServer lit env au chargement du module : sans .env (CI), le minimum requis suffit.
// Les 500 provoqués ici sont attendus : leurs traces n'ont rien à faire dans la sortie de test.
process.env.LOG_LEVEL = 'fatal';
process.env.JWT_SECRET ??= 'test-secret';
process.env.APP_URL ??= 'http://localhost:3000';
process.env.FRONTEND_PUBLIC_URL ??= 'http://localhost:5173';
process.env.FRONTEND_PRIVATE_URL ??= 'http://localhost:5174';

const orm = { em: {} } as unknown as MikroORM;

let createServer: (orm: MikroORM, recorder: ErrorLogRecorder) => FastifyInstance;
let record: ReturnType<typeof vi.fn>;

/** Laisse le microtask détaché par `void` se résoudre avant l'assertion. */
const flush = () => new Promise(resolve => setImmediate(resolve));

async function serverThrowing(error: unknown): Promise<FastifyInstance> {
    const app = createServer(orm, { record } as unknown as ErrorLogRecorder);
    app.get('/boom', () => {
        throw error;
    });
    await app.ready();
    return app;
}

beforeAll(async () => {
    ({ createServer } = await import('./server.js'));
});

beforeEach(() => {
    record = vi.fn(async () => {});
});

describe('setErrorHandler', () => {
    it('rend un 500 porteur de son identifiant de corrélation', async () => {
        const app = await serverThrowing(new Error('boom'));

        const res = await app.inject({ method: 'GET', url: '/boom' });

        expect(res.statusCode).toBe(500);
        expect(res.json()).toEqual({ error: 'Internal server error', requestId: expect.any(String) });
        await app.close();
    });

    it('journalise l’erreur avec l’identifiant rendu au client', async () => {
        const app = await serverThrowing(new Error('boom'));

        const res = await app.inject({ method: 'GET', url: '/boom' });
        await flush();

        expect(record).toHaveBeenCalledTimes(1);
        expect(record).toHaveBeenCalledWith(
            expect.objectContaining({
                origin: 'back',
                message: 'boom',
                url: '/boom',
                userId: null,
                correlationId: res.json().requestId,
                context: { method: 'GET', statusCode: 500 },
            }),
        );
        expect(record.mock.calls[0][0].stack).toContain('Error: boom');
        await app.close();
    });

    it('ne journalise pas un 404 : une ressource absente n’est pas une panne', async () => {
        const app = await serverThrowing(new NotFoundError('Project', 'abc'));

        const res = await app.inject({ method: 'GET', url: '/boom' });
        await flush();

        expect(res.statusCode).toBe(404);
        expect(record).not.toHaveBeenCalled();
        await app.close();
    });

    it('ne journalise pas un 400 : une règle métier refusée n’est pas une panne', async () => {
        const app = await serverThrowing(new DomainException());

        const res = await app.inject({ method: 'GET', url: '/boom' });
        await flush();

        expect(res.statusCode).toBe(400);
        expect(record).not.toHaveBeenCalled();
        await app.close();
    });

    it('rend le 500 même quand le journal est injoignable', async () => {
        record = vi.fn(async () => {
            throw new Error('database unreachable');
        });
        const app = await serverThrowing(new Error('boom'));

        const res = await app.inject({ method: 'GET', url: '/boom' });
        await flush();

        expect(res.statusCode).toBe(500);
        expect(res.json().error).toBe('Internal server error');
        await app.close();
    });
});
