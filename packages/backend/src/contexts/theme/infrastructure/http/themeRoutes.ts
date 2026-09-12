import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'node:crypto';
import { requirePrivateRead, requireRole } from '@shared/infrastructure/http/roleGuard.js';
import { UserRole } from '@shared/domain/valueObject/userRole.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { CreateThemeCommand } from '../../application/command/createTheme/createThemeCommand.js';
import { UpdateThemeCommand } from '../../application/command/updateTheme/updateThemeCommand.js';
import { SetDefaultThemeCommand } from '../../application/command/setDefaultTheme/setDefaultThemeCommand.js';
import { ListThemesQuery } from '../../application/query/listThemes/listThemesQuery.js';
import { ListVisibleThemesQuery } from '../../application/query/listVisibleThemes/listVisibleThemesQuery.js';
import { ThemeCatalogDto, ThemeDto } from '../../application/query/listThemes/themeCatalogDto.js';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

type ThemeDraft = { name: string; visible: boolean; colors: Record<string, string> };

const draftSchema = {
    type: 'object',
    required: ['name', 'visible', 'colors'],
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 60 },
        visible: { type: 'boolean' },
        colors: { type: 'object', additionalProperties: { type: 'string' } },
    },
} as const;

export const themeRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    // Ouverte : le site public a besoin du thème par défaut et de ceux que le visiteur
    // peut choisir. Les thèmes masqués ne sortent jamais par là.
    app.get('/themes', async (_req, reply) => {
        const catalog = await queryBus.dispatch<ListVisibleThemesQuery, ThemeCatalogDto>(new ListVisibleThemesQuery());
        return reply.send(catalog);
    });

    app.get('/themes/all', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const catalog = await queryBus.dispatch<ListThemesQuery, ThemeCatalogDto>(new ListThemesQuery());
        return reply.send(catalog);
    });

    app.post<{ Body: ThemeDraft }>(
        '/themes',
        { preHandler: requireRole(UserRole.EDIT), schema: { body: draftSchema } },
        async (req, reply) => {
            const created = await commandBus.dispatch<CreateThemeCommand, ThemeDto>(
                new CreateThemeCommand(randomUUID(), req.body.name, req.body.visible, req.body.colors),
            );
            return reply.status(201).send(created);
        },
    );

    app.put<{ Params: { id: string }; Body: ThemeDraft }>(
        '/themes/:id',
        { preHandler: requireRole(UserRole.EDIT), schema: { body: draftSchema } },
        async (req, reply) => {
            await commandBus.dispatch(
                new UpdateThemeCommand(req.params.id, req.body.name, req.body.visible, req.body.colors),
            );
            return reply.status(204).send();
        },
    );

    app.put<{ Body: { id: string } }>(
        '/themes/default',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new SetDefaultThemeCommand(req.body.id));
            return reply.status(204).send();
        },
    );
};
