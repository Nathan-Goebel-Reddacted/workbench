import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { requireRole, requirePrivateRead } from '@shared/infrastructure/http/roleGuard';
import { CreateIdeaCommand } from '@contexts/idea/application/command/createIdea/createIdeaCommand';
import { UpdateIdeaCommand } from '@contexts/idea/application/command/updateIdea/updateIdeaCommand';
import { DeleteIdeaCommand } from '@contexts/idea/application/command/deleteIdea/deleteIdeaCommand';
import { AddIdeaDocumentCommand } from '@contexts/idea/application/command/addIdeaDocument/addIdeaDocumentCommand';
import { RemoveIdeaDocumentCommand } from '@contexts/idea/application/command/removeIdeaDocument/removeIdeaDocumentCommand';
import { AddIdeaLinkCommand } from '@contexts/idea/application/command/addIdeaLink/addIdeaLinkCommand';
import { RemoveIdeaLinkCommand } from '@contexts/idea/application/command/removeIdeaLink/removeIdeaLinkCommand';
import { ConvertIdeaToProjectCommand } from '@contexts/idea/application/command/convertIdeaToProject/convertIdeaToProjectCommand';
import { GetIdeaByIdQuery } from '@contexts/idea/application/query/getIdeaById/getIdeaByIdQuery';
import { ListIdeasQuery } from '@contexts/idea/application/query/listIdeas/listIdeasQuery';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };
type LinkBody = { url: string; displayText: string; logo: string };
type DocumentBody = { name: string; url: string; type: string };

export const ideaRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get('/ideas', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const result = await queryBus.dispatch(new ListIdeasQuery());
        return reply.send(result);
    });

    app.get<{ Params: { id: string } }>('/ideas/:id', { preHandler: requirePrivateRead }, async (req, reply) => {
        const result = await queryBus.dispatch(new GetIdeaByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{
        Body: { name: string; description: string; links: LinkBody[]; documents: DocumentBody[]; category?: string };
    }>(
        '/ideas',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'description', 'links', 'documents'],
                    properties: {
                        name: { type: 'string', minLength: 1 },
                        description: { type: 'string' },
                        category: { type: 'string', enum: ['personal', 'professional', 'academic'] },
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
            const { name, description, links, documents, category } = req.body;
            const id = crypto.randomUUID();
            const docsWithId = documents.map(d => ({ ...d, id: crypto.randomUUID() }));
            await commandBus.dispatch(new CreateIdeaCommand(id, name, description, links, docsWithId, category));
            return reply.status(201).send({ id });
        },
    );

    // Convertir supprime l'idée : la confirmation côté interface doit l'annoncer.
    app.post<{ Params: { id: string }; Body?: { category?: string } }>(
        '/ideas/:id/convert-to-project',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    properties: {
                        category: { type: 'string', enum: ['personal', 'professional', 'academic'] },
                    },
                },
            },
        },
        async (req, reply) => {
            const projectId = crypto.randomUUID();
            await commandBus.dispatch(new ConvertIdeaToProjectCommand(req.params.id, projectId, req.body?.category));
            return reply.status(201).send({ projectId });
        },
    );

    app.put<{ Params: { id: string }; Body: { name: string; description: string; category?: string } }>(
        '/ideas/:id',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'description'],
                    properties: {
                        name: { type: 'string', minLength: 1 },
                        description: { type: 'string' },
                        category: { type: 'string', enum: ['personal', 'professional', 'academic'] },
                    },
                },
            },
        },
        async (req, reply) => {
            const { name, description, category } = req.body;
            await commandBus.dispatch(new UpdateIdeaCommand(req.params.id, name, description, category));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string } }>('/ideas/:id', { preHandler: requireRole('edit') }, async (req, reply) => {
        await commandBus.dispatch(new DeleteIdeaCommand(req.params.id));
        return reply.status(204).send();
    });

    app.post<{ Params: { id: string }; Body: DocumentBody }>(
        '/ideas/:id/documents',
        {
            preHandler: requireRole('edit'),
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
        { preHandler: requireRole('edit') },
        async (req, reply) => {
            await commandBus.dispatch(new RemoveIdeaDocumentCommand(req.params.id, req.params.documentId));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: LinkBody }>(
        '/ideas/:id/links',
        {
            preHandler: requireRole('edit'),
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
            preHandler: requireRole('edit'),
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
