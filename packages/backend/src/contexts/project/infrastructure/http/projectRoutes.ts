import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateProjectCommand } from '@contexts/project/application/command/createProject/createProjectCommand';
import { AddProjectDocumentCommand } from '@contexts/project/application/command/addProjectDocument/addProjectDocumentCommand';
import { RemoveProjectDocumentCommand } from '@contexts/project/application/command/removeProjectDocument/removeProjectDocumentCommand';
import { AddProjectLinkCommand } from '@contexts/project/application/command/addProjectLink/addProjectLinkCommand';
import { RemoveProjectLinkCommand } from '@contexts/project/application/command/removeProjectLink/removeProjectLinkCommand';
import { GetProjectByIdQuery } from '@contexts/project/application/query/getProjectById/getProjectByIdQuery';
import { ListProjectsQuery } from '@contexts/project/application/query/listProjects/listProjectsQuery';
import { UpdateProjectCommand } from '@contexts/project/application/command/updateProject/updateProjectCommand';
import { UpdateProjectVisibilityCommand } from '@contexts/project/application/command/updateProjectVisibility/updateProjectVisibilityCommand';
import { Category } from '@contexts/project/domain/valueObject/category';
import { requireRole, hasPrivateRead } from '@shared/infrastructure/http/roleGuard';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };
type LinkBody = { url: string; displayText: string; logo: string };
type DocumentBody = { name: string; url: string; type: string };

export const projectRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get('/projects', async (req, reply) => {
        const result = await queryBus.dispatch(new ListProjectsQuery(hasPrivateRead(req)));
        return reply.send(result);
    });

    app.get<{ Params: { id: string } }>('/projects/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetProjectByIdQuery(req.params.id, hasPrivateRead(req)));
        return reply.send(result);
    });

    app.post<{
        Body: { name: string; description: string; links: LinkBody[]; documents: DocumentBody[]; category?: string };
    }>(
        '/projects',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'description', 'links', 'documents'],
                    properties: {
                        name: { type: 'string', minLength: 1 },
                        description: { type: 'string' },
                        category: { type: 'string', enum: Object.values(Category) },
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
            await commandBus.dispatch(new CreateProjectCommand(id, name, description, links, docsWithId, category));
            return reply.status(201).send({ id });
        },
    );

    app.patch<{ Params: { id: string }; Body: { name: string; description: string; category?: string } }>(
        '/projects/:id',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'description'],
                    properties: {
                        name: { type: 'string', minLength: 1 },
                        description: { type: 'string' },
                        category: { type: 'string', enum: Object.values(Category) },
                    },
                },
            },
        },
        async (req, reply) => {
            const { name, description, category } = req.body;
            await commandBus.dispatch(new UpdateProjectCommand(req.params.id, name, description, category));
            return reply.status(204).send();
        },
    );

    app.patch<{ Params: { id: string }; Body: { visible: boolean } }>(
        '/projects/:id/visibility',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['visible'],
                    properties: { visible: { type: 'boolean' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new UpdateProjectVisibilityCommand(req.params.id, req.body.visible));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: DocumentBody }>(
        '/projects/:id/documents',
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
            await commandBus.dispatch(
                new AddProjectDocumentCommand(req.params.id, crypto.randomUUID(), name, url, type),
            );
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; documentId: string } }>(
        '/projects/:id/documents/:documentId',
        { preHandler: requireRole('edit') },
        async (req, reply) => {
            await commandBus.dispatch(new RemoveProjectDocumentCommand(req.params.id, req.params.documentId));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: LinkBody }>(
        '/projects/:id/links',
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
            await commandBus.dispatch(new AddProjectLinkCommand(req.params.id, url, displayText, logo));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string }; Body: LinkBody }>(
        '/projects/:id/links',
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
            await commandBus.dispatch(new RemoveProjectLinkCommand(req.params.id, url, displayText, logo));
            return reply.status(204).send();
        },
    );
};
