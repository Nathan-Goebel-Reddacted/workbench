import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreatePortfolioCommand } from '@contexts/portfolio/application/command/createPortfolio/createPortfolioCommand';
import { UpdatePortfolioDescriptionCommand } from '@contexts/portfolio/application/command/updatePortfolioDescription/updatePortfolioDescriptionCommand';
import { AddPortfolioLinkCommand } from '@contexts/portfolio/application/command/addPortfolioLink/addPortfolioLinkCommand';
import { RemovePortfolioLinkCommand } from '@contexts/portfolio/application/command/removePortfolioLink/removePortfolioLinkCommand';
import { AddPortfolioLanguageCommand } from '@contexts/portfolio/application/command/addPortfolioLanguage/addPortfolioLanguageCommand';
import { RemovePortfolioLanguageCommand } from '@contexts/portfolio/application/command/removePortfolioLanguage/removePortfolioLanguageCommand';
import { GetPortfolioByIdQuery } from '@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdQuery';
import { GetPortfolioByUserIdQuery } from '@contexts/portfolio/application/query/getPortfolioByUserId/getPortfolioByUserIdQuery';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };
type LinkBody = { url: string; displayText: string; logo: string };

export const portfolioRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Params: { userId: string } }>('/portfolios/by-user/:userId', async (req, reply) => {
        const result = await queryBus.dispatch(new GetPortfolioByUserIdQuery(req.params.userId));
        return reply.send(result);
    });

    app.get<{ Params: { id: string } }>('/portfolios/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetPortfolioByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{ Body: { userId: string; description: string; links: LinkBody[] } }>(
        '/portfolios',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['userId', 'description', 'links'],
                    properties: {
                        userId: { type: 'string' },
                        description: { type: 'string' },
                        links: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['url', 'displayText', 'logo'],
                                properties: {
                                    url: { type: 'string' },
                                    displayText: { type: 'string' },
                                    logo: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
        async (req, reply) => {
            const { userId, description, links } = req.body;
            await commandBus.dispatch(new CreatePortfolioCommand(crypto.randomUUID(), userId, description, links));
            return reply.status(201).send();
        },
    );

    app.patch<{ Params: { id: string }; Body: { description: string } }>(
        '/portfolios/:id/description',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['description'],
                    properties: { description: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new UpdatePortfolioDescriptionCommand(req.params.id, req.body.description));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: LinkBody }>(
        '/portfolios/:id/links',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['url', 'displayText', 'logo'],
                    properties: {
                        url: { type: 'string' },
                        displayText: { type: 'string' },
                        logo: { type: 'string' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { url, displayText, logo } = req.body;
            await commandBus.dispatch(new AddPortfolioLinkCommand(req.params.id, url, displayText, logo));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string }; Body: LinkBody }>(
        '/portfolios/:id/links',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['url', 'displayText', 'logo'],
                    properties: {
                        url: { type: 'string' },
                        displayText: { type: 'string' },
                        logo: { type: 'string' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { url, displayText, logo } = req.body;
            await commandBus.dispatch(new RemovePortfolioLinkCommand(req.params.id, url, displayText, logo));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: { language: string } }>(
        '/portfolios/:id/languages',
        {
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
