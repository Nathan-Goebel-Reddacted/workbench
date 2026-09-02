import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreatePortfolioCommand } from '@contexts/portfolio/application/command/createPortfolio/createPortfolioCommand';
import { AddPortfolioLanguageCommand } from '@contexts/portfolio/application/command/addPortfolioLanguage/addPortfolioLanguageCommand';
import { RemovePortfolioLanguageCommand } from '@contexts/portfolio/application/command/removePortfolioLanguage/removePortfolioLanguageCommand';
import { GetPortfolioByIdQuery } from '@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdQuery';
import { GetPortfolioQuery } from '@contexts/portfolio/application/query/getPortfolio/getPortfolioQuery';
import { requirePrivateRead, requireRole } from '@shared/infrastructure/http/roleGuard';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

export const portfolioRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get('/portfolio', async (_req, reply) => {
        const result = await queryBus.dispatch(new GetPortfolioQuery());
        return reply.send(result);
    });

    app.get<{ Params: { id: string } }>('/portfolios/:id', { preHandler: requirePrivateRead }, async (req, reply) => {
        const result = await queryBus.dispatch(new GetPortfolioByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post('/portfolios', { preHandler: requireRole('edit') }, async (_req, reply) => {
        await commandBus.dispatch(new CreatePortfolioCommand(crypto.randomUUID()));
        return reply.status(201).send();
    });

    app.post<{ Params: { id: string }; Body: { language: string } }>(
        '/portfolios/:id/languages',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['language'],
                    properties: { language: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new AddPortfolioLanguageCommand(req.params.id, req.body.language));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string }; Body: { language: string } }>(
        '/portfolios/:id/languages',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['language'],
                    properties: { language: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new RemovePortfolioLanguageCommand(req.params.id, req.body.language));
            return reply.status(204).send();
        },
    );
};
