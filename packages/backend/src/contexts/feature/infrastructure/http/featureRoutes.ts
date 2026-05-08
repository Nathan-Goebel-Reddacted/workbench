import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateFeatureCommand } from '@contexts/feature/application/command/createFeature/createFeatureCommand';
import { AddFeatureDocumentCommand } from '@contexts/feature/application/command/addFeatureDocument/addFeatureDocumentCommand';
import { RemoveFeatureDocumentCommand } from '@contexts/feature/application/command/removeFeatureDocument/removeFeatureDocumentCommand';
import { GetFeatureByIdQuery } from '@contexts/feature/application/query/getFeatureById/getFeatureByIdQuery';
import { GetFeaturesByProjectIdQuery } from '@contexts/feature/application/query/getFeaturesByProjectId/getFeaturesByProjectIdQuery';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };
type DocumentBody = { name: string; url: string; type: string };

export const featureRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Params: { projectId: string } }>('/features/by-project/:projectId', async (req, reply) => {
        const result = await queryBus.dispatch(new GetFeaturesByProjectIdQuery(req.params.projectId));
        return reply.send(result);
    });

    app.get<{ Params: { id: string } }>('/features/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetFeatureByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{ Body: { projectId: string; name: string; description: string; documents: DocumentBody[] } }>(
        '/features',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['projectId', 'name', 'description', 'documents'],
                    properties: {
                        projectId: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
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
            const { projectId, name, description, documents } = req.body;
            const id = crypto.randomUUID();
            const docsWithId = documents.map(d => ({ ...d, id: crypto.randomUUID() }));
            await commandBus.dispatch(new CreateFeatureCommand(id, projectId, name, description, docsWithId));
            return reply.status(201).send({ id });
        },
    );

    app.post<{ Params: { id: string }; Body: DocumentBody }>(
        '/features/:id/documents',
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
            await commandBus.dispatch(new AddFeatureDocumentCommand(req.params.id, crypto.randomUUID(), name, url, type));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; documentId: string } }>(
        '/features/:id/documents/:documentId',
        async (req, reply) => {
            await commandBus.dispatch(new RemoveFeatureDocumentCommand(req.params.id, req.params.documentId));
            return reply.status(204).send();
        },
    );
};
