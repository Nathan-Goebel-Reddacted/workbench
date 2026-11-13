import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'node:crypto';
import { requirePrivateRead, requireRole } from '@shared/infrastructure/http/roleGuard.js';
import { UserRole } from '@shared/domain/valueObject/userRole.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { CreateThemeCommand } from '../../application/command/createTheme/createThemeCommand.js';
import { RenameThemeCommand } from '../../application/command/renameTheme/renameThemeCommand.js';
import { RecolorThemeCommand } from '../../application/command/recolorTheme/recolorThemeCommand.js';
import { ChangeThemeVisibilityCommand } from '../../application/command/changeThemeVisibility/changeThemeVisibilityCommand.js';
import { SetDefaultThemeCommand } from '../../application/command/setDefaultTheme/setDefaultThemeCommand.js';
import { ListThemesQuery } from '../../application/query/listThemes/listThemesQuery.js';
import { ListVisibleThemesQuery } from '../../application/query/listVisibleThemes/listVisibleThemesQuery.js';
import { ThemeCatalogDto, ThemeDto } from '../../application/query/listThemes/themeCatalogDto.js';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

type NewTheme = { name?: string; visible?: boolean; colors: Record<string, string> };

const nameProperty = { type: 'string', minLength: 1, maxLength: 60 } as const;
const visibleProperty = { type: 'boolean' } as const;
const colorsProperty = { type: 'object', additionalProperties: { type: 'string' } } as const;

const newThemeSchema = {
    type: 'object',
    required: ['colors'],
    properties: { name: nameProperty, visible: visibleProperty, colors: colorsProperty },
} as const;

export const themeRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    // Ouverte : le site public a besoin du thème par défaut et de ceux que le visiteur
    // peut choisir. Les thèmes masqués ne sortent jamais par là.
    app.get('/themes', { config: { servedWhenSiteClosed: true } }, async (_req, reply) => {
        const catalog = await queryBus.dispatch<ListVisibleThemesQuery, ThemeCatalogDto>(new ListVisibleThemesQuery());
        return reply.send(catalog);
    });

    app.get('/themes/all', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const catalog = await queryBus.dispatch<ListThemesQuery, ThemeCatalogDto>(new ListThemesQuery());
        return reply.send(catalog);
    });

    app.post<{ Body: NewTheme }>(
        '/themes',
        { preHandler: requireRole(UserRole.EDIT), schema: { body: newThemeSchema } },
        async (req, reply) => {
            const { name, visible, colors } = req.body;
            const created = await commandBus.dispatch<CreateThemeCommand, ThemeDto>(
                new CreateThemeCommand(randomUUID(), name ?? null, visible ?? null, colors),
            );
            return reply.status(201).send(created);
        },
    );

    app.patch<{ Params: { id: string }; Body: { name: string } }>(
        '/themes/:id/name',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: { body: { type: 'object', required: ['name'], properties: { name: nameProperty } } },
        },
        async (req, reply) => {
            await commandBus.dispatch(new RenameThemeCommand(req.params.id, req.body.name));
            return reply.status(204).send();
        },
    );

    app.patch<{ Params: { id: string }; Body: { colors: Record<string, string> } }>(
        '/themes/:id/colors',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: { body: { type: 'object', required: ['colors'], properties: { colors: colorsProperty } } },
        },
        async (req, reply) => {
            await commandBus.dispatch(new RecolorThemeCommand(req.params.id, req.body.colors));
            return reply.status(204).send();
        },
    );

    app.patch<{ Params: { id: string }; Body: { visible: boolean } }>(
        '/themes/:id/visibility',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: { body: { type: 'object', required: ['visible'], properties: { visible: visibleProperty } } },
        },
        async (req, reply) => {
            await commandBus.dispatch(new ChangeThemeVisibilityCommand(req.params.id, req.body.visible));
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
