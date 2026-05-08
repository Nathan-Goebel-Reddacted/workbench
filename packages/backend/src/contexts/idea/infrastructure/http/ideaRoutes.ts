import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateIdeaCommand } from '@contexts/idea/application/command/createIdea/createIdeaCommand';
import { AddIdeaDocumentCommand } from '@contexts/idea/application/command/addIdeaDocument/addIdeaDocumentCommand';
import { RemoveIdeaDocumentCommand } from '@contexts/idea/application/command/removeIdeaDocument/removeIdeaDocumentCommand';
import { AddIdeaLinkCommand } from '@contexts/idea/application/command/addIdeaLink/addIdeaLinkCommand';
import { RemoveIdeaLinkCommand } from '@contexts/idea/application/command/removeIdeaLink/removeIdeaLinkCommand';
import { GetIdeaByIdQuery } from '@contexts/idea/application/query/getIdeaById/getIdeaByIdQuery';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };
type LinkBody = { url: string; displayText: string; logo: string };
type DocumentBody = { name: string; url: string; type: string };

export const ideaRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Params: { id: string } }>('/ideas/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetIdeaByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{ Body: { description: string; links: LinkBody[]; documents: DocumentBody[] } }>(
        '/ideas',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['description', 'links', 'documents'],
                    properties: {
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
                        documents: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['name', 'url', 'type'],
                                properties: {
                                    name: { type: 'string' },
                                    url: { type: 'string' },
                                    type: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
        async (req, reply) => {
            const { description, links, documents } = req.body;
            const id = crypto.randomUUID();
            const docsWithId = documents.map(d => ({ ...d, id: crypto.randomUUID() }));
            await commandBus.dispatch(new CreateIdeaCommand(id, description, links, docsWithId));
            return reply.status(201).send({ id });
        },
    );

    app.post<{ Params: { id: string }; Body: DocumentBody }>(
        '/ideas/:id/documents',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'url', 'type'],
                    properties: {
                        name: { type: 'string' },
                        url: { type: 'string' },
                        type: { type: 'string' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { name, url, type } = req.body;
            await commandBus.dispatch(new AddIdeaDocumentCommand(req.params.id, crypto.randomUUID(), name, url, type));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; documentId: string } }>(
        '/ideas/:id/documents/:documentId',
        async (req, reply) => {
            await commandBus.dispatch(new RemoveIdeaDocumentCommand(req.params.id, req.params.documentId));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: LinkBody }>(
        '/ideas/:id/links',
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
            await commandBus.dispatch(new AddIdeaLinkCommand(req.params.id, url, displayText, logo));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string }; Body: LinkBody }>(
        '/ideas/:id/links',
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
            await commandBus.dispatch(new RemoveIdeaLinkCommand(req.params.id, url, displayText, logo));
            return reply.status(204).send();
        },
    );
};
