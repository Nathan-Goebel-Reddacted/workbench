import { FastifyPluginAsync } from 'fastify';
import { requirePrivateRead, requireRole } from './roleGuard.js';
import {
    createTheme,
    readCatalog,
    readVisibleCatalog,
    setDefaultTheme,
    updateTheme,
    type ThemeDraft,
} from '@shared/infrastructure/theme/themeStore.js';

const draftSchema = {
    type: 'object',
    required: ['name', 'visible', 'colors'],
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 60 },
        visible: { type: 'boolean' },
        colors: { type: 'object', additionalProperties: { type: 'string' } },
    },
} as const;

export const themeRoutes: FastifyPluginAsync = async app => {
    // Ouverte : le site public a besoin du thème par défaut et de ceux que le visiteur
    // peut choisir. Les thèmes masqués ne sortent jamais par là.
    app.get('/themes', async (_req, reply) => {
        return reply.send(readVisibleCatalog());
    });

    app.get('/themes/all', { preHandler: requirePrivateRead }, async (_req, reply) => {
        return reply.send(readCatalog());
    });

    app.post<{ Body: ThemeDraft }>(
        '/themes',
        { preHandler: requireRole('edit'), schema: { body: draftSchema } },
        async (req, reply) => {
            return reply.status(201).send(createTheme(req.body));
        },
    );

    app.put<{ Params: { id: string }; Body: ThemeDraft }>(
        '/themes/:id',
        { preHandler: requireRole('edit'), schema: { body: draftSchema } },
        async (req, reply) => {
            if (!updateTheme(req.params.id, req.body)) {
                return reply.status(404).send({ error: 'Theme not found' });
            }
            return reply.status(204).send();
        },
    );

    app.put<{ Body: { id: string } }>(
        '/themes/default',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
            },
        },
        async (req, reply) => {
            if (!setDefaultTheme(req.body.id)) {
                return reply.status(404).send({ error: 'Theme not found' });
            }
            return reply.status(204).send();
        },
    );
};
