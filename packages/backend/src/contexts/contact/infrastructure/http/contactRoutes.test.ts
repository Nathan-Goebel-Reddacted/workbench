import { beforeEach, describe, expect, it } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { contactRoutes } from './contactRoutes.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { SubmitContactMessageCommand } from '@contexts/contact/application/command/submitContactMessage/submitContactMessageCommand.js';
import { ContactMessageFactory } from '@contexts/contact/domain/factory/contactMessageFactory.js';
import { EmptyContactMessageException } from '@contexts/contact/domain/exception/emptyContactMessage.js';
import { DomainException } from '@shared/domain/domainException.js';

// `POST /contact` est la seule écriture publique de l'application : appelant anonyme, et
// possiblement hostile. Ce qui se joue ici est la défense anti-robot — honeypot et délai
// minimal — et le fait qu'elle réponde 200 : un robot ne doit rien apprendre de son échec.

let submitted: SubmitContactMessageCommand[];

/** Le vrai domaine derrière le bus : la sélection de l'adresse de réponse s'y décide. */
function app(): FastifyInstance {
    const factory = new ContactMessageFactory();
    const commandBus = new CommandBus();
    commandBus.register(SubmitContactMessageCommand.commandName, {
        handle: async (command: SubmitContactMessageCommand) => {
            // Construire le message applique les règles ; on garde la commande pour l'inspecter.
            factory.submit(command.id, command.fields);
            submitted.push(command);
        },
    });

    const instance = Fastify();
    // Le gestionnaire d'erreurs du vrai serveur, réduit à ce qui compte ici : une règle
    // métier refusée devient 400, une requête malformée garde le statut que Fastify lui a
    // donné, et le reste est une panne.
    instance.setErrorHandler((error, _req, reply) => {
        if (error instanceof DomainException) return reply.status(400).send({ error: error.message });
        const clientError = error as Error & { statusCode?: number };
        const status = clientError.statusCode;
        if (status !== undefined && status >= 400 && status < 500) {
            return reply.status(status).send({ error: clientError.message });
        }
        return reply.status(500).send({ error: 'Internal server error' });
    });
    void instance.register(contactRoutes, { commandBus, queryBus: new QueryBus() });
    return instance;
}

const body = (fields: unknown, extra: Record<string, unknown> = {}) => ({
    fields,
    renderedAt: Date.now() - 60_000,
    ...extra,
});

beforeEach(() => {
    submitted = [];
});

describe('POST /contact', () => {
    it('accepte une soumission ordinaire', async () => {
        const instance = app();

        const res = await instance.inject({
            method: 'POST',
            url: '/contact',
            payload: body([{ label: 'Message', value: 'bonjour' }]),
        });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ ok: true });
        expect(submitted).toHaveLength(1);
        await instance.close();
    });

    it('laisse le domaine choisir l’adresse de réponse — la route transmet les champs bruts', async () => {
        const instance = app();

        await instance.inject({
            method: 'POST',
            url: '/contact',
            payload: body([
                { label: 'Nom', value: 'Jean' },
                { label: 'Email', value: 'jean@exemple.fr', type: 'email' },
            ]),
        });

        // La route n'a rien extrait : les champs arrivent tels quels, avec leur type.
        expect(submitted[0].fields).toEqual([
            { label: 'Nom', value: 'Jean' },
            { label: 'Email', value: 'jean@exemple.fr', type: 'email' },
        ]);
        await instance.close();
    });

    it('écarte un remplissage du honeypot, en répondant 200', async () => {
        const instance = app();

        const res = await instance.inject({
            method: 'POST',
            url: '/contact',
            payload: body([{ label: 'Message', value: 'spam' }], { _hp: 'je suis un robot' }),
        });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ ok: true });
        // Rien n'est enregistré, mais le robot lit un succès.
        expect(submitted).toHaveLength(0);
        await instance.close();
    });

    it('écarte une soumission instantanée, en répondant 200', async () => {
        const instance = app();

        const res = await instance.inject({
            method: 'POST',
            url: '/contact',
            payload: { fields: [{ label: 'Message', value: 'spam' }], renderedAt: Date.now() },
        });

        expect(res.statusCode).toBe(200);
        expect(submitted).toHaveLength(0);
        await instance.close();
    });

    it('rend 400 sur un formulaire entièrement vide', async () => {
        const instance = app();

        const res = await instance.inject({
            method: 'POST',
            url: '/contact',
            payload: body([{ label: 'Message', value: '   ' }]),
        });

        expect(res.statusCode).toBe(400);
        expect(res.json()).toEqual({ error: new EmptyContactMessageException().message });
        await instance.close();
    });

    it('refuse un corps hors schéma sans atteindre le domaine', async () => {
        const instance = app();

        const tooMany = Array.from({ length: 21 }, (_, i) => ({ label: `c${i}`, value: 'x' }));
        const res = await instance.inject({ method: 'POST', url: '/contact', payload: body(tooMany) });

        expect(res.statusCode).toBe(400);
        expect(submitted).toHaveLength(0);
        await instance.close();
    });

    it('refuse une valeur au-delà du plafond de caractères', async () => {
        const instance = app();

        const res = await instance.inject({
            method: 'POST',
            url: '/contact',
            payload: body([{ label: 'Message', value: 'x'.repeat(5001) }]),
        });

        expect(res.statusCode).toBe(400);
        expect(submitted).toHaveLength(0);
        await instance.close();
    });
});

describe('lecture et suppression', () => {
    it('sont réservées aux éditeurs', async () => {
        const instance = app();
        // Sans `req.user`, `requireRole` refuse — c'est le garde de rôle qui est vérifié ici,
        // le garde de session vivant dans createServer.
        const read = await instance.inject({ method: 'GET', url: '/contact' });
        const wipe = await instance.inject({ method: 'DELETE', url: '/contact' });

        expect(read.statusCode).toBe(403);
        expect(wipe.statusCode).toBe(403);
        await instance.close();
    });
});
