import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type { MikroORM } from '@mikro-orm/postgresql';
import pino from 'pino';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import { DomainException } from '@shared/domain/domainException.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { RecordErrorLogEntryCommand } from '@contexts/errorLog/application/command/recordErrorLogEntry/recordErrorLogEntryCommand.js';
import { ErrorOrigin } from '@contexts/errorLog/domain/valueObject/errorOrigin.js';

// Le gestionnaire d'erreurs est le seul endroit où une panne serveur devient une ligne de
// journal. Deux choses s'y jouent et ne se voient nulle part ailleurs : les erreurs *attendues*
// (404, 400) n'ont rien à y faire, et une écriture qui échoue ne doit pas changer la réponse
// déjà partie au client.
//
// Depuis que le journal passe par le bus, ces tests couvrent aussi le câblage lui-même : le
// serveur n'a plus de dépendance directe au journal, et une commande non enregistrée ferait
// échouer l'écriture en silence.

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
process.env.JWT_SECRET ??= '0'.repeat(64);
process.env.APP_URL ??= 'http://localhost:3000';
process.env.FRONTEND_PUBLIC_URL ??= 'http://localhost:5173';
process.env.FRONTEND_PRIVATE_URL ??= 'http://localhost:5174';

const orm = { em: {} } as unknown as MikroORM;
const silentLogger = pino({ level: 'silent' }) as unknown as FastifyBaseLogger;

let createServer: (orm: MikroORM, commandBus: CommandBus, logger: FastifyBaseLogger) => FastifyInstance;
// Typé explicitement plutôt que par `ReturnType<typeof vi.fn>` : ce dernier rend un mock
// générique que le bus refuse, et sa forme a changé entre les versions de vitest.
let record: Mock<(command: RecordErrorLogEntryCommand) => Promise<void>>;

/** Laisse le microtask détaché par `void` se résoudre avant l'assertion. */
const flush = () => new Promise(resolve => setImmediate(resolve));

function busRecording(): CommandBus {
    const bus = new CommandBus();
    bus.register(RecordErrorLogEntryCommand.commandName, { handle: record });
    return bus;
}

async function serverThrowing(error: unknown): Promise<FastifyInstance> {
    const app = createServer(orm, busRecording(), silentLogger);
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
        await flush();

        expect(res.statusCode).toBe(500);
        expect(res.json()).toMatchObject({ error: 'Internal server error' });
        expect(res.json().requestId).toBeTruthy();
        await app.close();
    });

    it('consigne la panne dans le journal, par le bus', async () => {
        const app = await serverThrowing(new Error('boom'));

        await app.inject({ method: 'GET', url: '/boom' });
        await flush();

        expect(record).toHaveBeenCalledTimes(1);
        const command = record.mock.calls[0][0] as RecordErrorLogEntryCommand;
        expect(command.origin).toBe(ErrorOrigin.BACK);
        expect(command.message).toBe('boom');
        expect(command.details.url).toBe('/boom');
        expect(command.details.context).toMatchObject({ method: 'GET', statusCode: 500 });
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
        const app = await serverThrowing(new DomainException('A ticket held by an idea stays pending'));

        const res = await app.inject({ method: 'GET', url: '/boom' });
        await flush();

        expect(res.statusCode).toBe(400);
        expect(res.json()).toEqual({ error: 'A ticket held by an idea stays pending' });
        expect(record).not.toHaveBeenCalled();
        await app.close();
    });

    it('rend une requête malformée à son auteur, sans la consigner', async () => {
        // Ce gestionnaire remplace celui de Fastify : sans branche pour `statusCode`, un corps
        // hors schéma devenait un 500 journalisé, et n'importe qui pouvait remplir le journal
        // en envoyant n'importe quoi sur une route publique.
        const app = createServer(orm, busRecording(), silentLogger);
        app.post(
            '/strict',
            {
                config: { public: true },
                schema: {
                    body: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
                },
            },
            async () => ({ ok: true }),
        );
        await app.ready();

        // Champ obligatoire absent : ajv convertit les types compatibles, il ne devine pas
        // ce qui manque.
        const res = await app.inject({ method: 'POST', url: '/strict', payload: { autre: 'x' } });
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
        await app.close();
    });
});
