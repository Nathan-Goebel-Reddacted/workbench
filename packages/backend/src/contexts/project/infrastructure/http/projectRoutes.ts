import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateProjectCommand } from '@contexts/project/application/command/createProject/createProjectCommand';
import { AddProjectDocumentCommand } from '@contexts/project/application/command/addProjectDocument/addProjectDocumentCommand';
import { RemoveProjectDocumentCommand } from '@contexts/project/application/command/removeProjectDocument/removeProjectDocumentCommand';
import { AddProjectLinkCommand } from '@contexts/project/application/command/addProjectLink/addProjectLinkCommand';
import { RemoveProjectLinkCommand } from '@contexts/project/application/command/removeProjectLink/removeProjectLinkCommand';
import { GetProjectByIdQuery } from '@contexts/project/application/query/getProjectById/getProjectByIdQuery';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };
type LinkBody = { url: string; displayText: string; logo: string };
type DocumentBody = { name: string; url: string; type: string };

export const projectRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Params: { id: string } }>('/projects/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetProjectByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{ Body: { description: string; links: LinkBody[]; documents: DocumentBody[] } }>(
        '/projects',
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
            await commandBus.dispatch(new CreateProjectCommand(id, description, links, docsWithId));
            return reply.status(201).send({ id });
        },
    );

    app.post<{ Params: { id: string }; Body: DocumentBody }>(
        '/projects/:id/documents',
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
            await commandBus.dispatch(new AddProjectDocumentCommand(req.params.id, crypto.randomUUID(), name, url, type));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; documentId: string } }>(
        '/projects/:id/documents/:documentId',
        async (req, reply) => {
            await commandBus.dispatch(new RemoveProjectDocumentCommand(req.params.id, req.params.documentId));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: LinkBody }>(
        '/projects/:id/links',
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
            await commandBus.dispatch(new AddProjectLinkCommand(req.params.id, url, displayText, logo));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string }; Body: LinkBody }>(
        '/projects/:id/links',
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
            await commandBus.dispatch(new RemoveProjectLinkCommand(req.params.id, url, displayText, logo));
            return reply.status(204).send();
        },
    );
};
