import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { hasPrivateRead, requireRole } from '@shared/infrastructure/http/roleGuard.js';
import { UserRole } from '@shared/domain/valueObject/userRole.js';
import { SetSiteAccessCommand } from '../../application/command/setSiteAccess/setSiteAccessCommand.js';
import { GetSiteAccessQuery } from '../../application/query/getSiteAccess/getSiteAccessQuery.js';
import { SiteAccessDto } from '../../application/query/getSiteAccess/siteAccessDto.js';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

export const siteRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    // Pas `public` : la session doit être lue pour dire si le site est servi à cet appelant.
    app.get('/site-access', { config: { servedWhenSiteClosed: true } }, async (req, reply) => {
        const { open } = await queryBus.dispatch<GetSiteAccessQuery, SiteAccessDto>(new GetSiteAccessQuery());
        return reply.header('Cache-Control', 'no-store').send({ open, served: open || hasPrivateRead(req) });
    });

    app.patch<{ Body: { open: boolean } }>(
        '/site-access',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['open'],
                    properties: { open: { type: 'boolean' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new SetSiteAccessCommand(req.body.open));
            return reply.status(204).send();
        },
    );
};
