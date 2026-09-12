import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { requireRole } from '@shared/infrastructure/http/roleGuard';
import { SubmitContactMessageCommand } from '@contexts/contact/application/command/submitContactMessage/submitContactMessageCommand';
import { DeleteContactMessageCommand } from '@contexts/contact/application/command/deleteContactMessage/deleteContactMessageCommand';
import { DeleteAllContactMessagesCommand } from '@contexts/contact/application/command/deleteAllContactMessages/deleteAllContactMessagesCommand';
import { ListContactMessagesQuery } from '@contexts/contact/application/query/listContactMessages/listContactMessagesQuery';

import { UserRole } from '@shared/domain/valueObject/userRole';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

type SubmittedField = { label: string; value: string; type?: string };

type ContactBody = {
    fields: SubmittedField[];
    /** Honeypot: a real visitor never sees this input, so a filled one means a bot. */
    _hp?: string;
    /** Epoch ms captured when the form was rendered — used to reject instant submissions. */
    renderedAt?: number;
};

/** A human needs at least this long to fill a form; anything faster is scripted. */
const MIN_FILL_MS = 3000;

const bodySchema = {
    type: 'object',
    required: ['fields'],
    properties: {
        fields: {
            type: 'array',
            minItems: 1,
            maxItems: 20,
            items: {
                type: 'object',
                required: ['label', 'value'],
                properties: {
                    label: { type: 'string', maxLength: 200 },
                    value: { type: 'string', maxLength: 5000 },
                    type: { type: 'string' },
                },
            },
        },
        _hp: { type: 'string' },
        renderedAt: { type: 'number' },
    },
} as const;

/**
 * POST is the only public write endpoint of the app: it assumes an unauthenticated, possibly
 * hostile caller, and spam is answered with a plain 200 so bots learn nothing. Reading and
 * deleting the stored messages is reserved to editors.
 */
export const contactRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get('/contact', { preHandler: requireRole(UserRole.EDIT) }, async (_req, reply) => {
        const result = await queryBus.dispatch(new ListContactMessagesQuery());
        return reply.send(result);
    });

    app.delete<{ Params: { id: string } }>(
        '/contact/:id',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            await commandBus.dispatch(new DeleteContactMessageCommand(req.params.id));
            return reply.status(204).send();
        },
    );

    app.delete('/contact', { preHandler: requireRole(UserRole.EDIT) }, async (_req, reply) => {
        await commandBus.dispatch(new DeleteAllContactMessagesCommand());
        return reply.status(204).send();
    });

    app.post<{ Body: ContactBody }>(
        '/contact',
        {
            schema: { body: bodySchema },
            config: { public: true, rateLimit: { max: 5, timeWindow: '1 hour' } },
        },
        async (req, reply) => {
            const { fields, _hp, renderedAt } = req.body;

            // Honeypot et délai minimal sont de la défense de transport, pas du métier : ils
            // écartent des robots, pas des messages invalides. Ils restent donc ici, et
            // répondent 200 pour que le robot n'apprenne rien de son échec.
            const tooFast = typeof renderedAt === 'number' && Date.now() - renderedAt < MIN_FILL_MS;
            if ((_hp && _hp.trim() !== '') || tooFast) {
                req.log.info({ reason: tooFast ? 'too-fast' : 'honeypot' }, 'contact submission dropped');
                return reply.send({ ok: true });
            }

            // Les champs partent bruts, avec leur type : c'est le domaine qui décide lequel
            // porte l'adresse de réponse. Un message vide remonte en DomainException, que le
            // gestionnaire d'erreurs rend en 400.
            await commandBus.dispatch(new SubmitContactMessageCommand(crypto.randomUUID(), fields));

            return reply.send({ ok: true });
        },
    );
};
