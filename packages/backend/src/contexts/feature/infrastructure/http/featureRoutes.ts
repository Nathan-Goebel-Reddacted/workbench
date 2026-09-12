import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateFeatureCommand } from '@contexts/feature/application/command/createFeature/createFeatureCommand';
import { AddFeatureDocumentCommand } from '@contexts/feature/application/command/addFeatureDocument/addFeatureDocumentCommand';
import { RemoveFeatureDocumentCommand } from '@contexts/feature/application/command/removeFeatureDocument/removeFeatureDocumentCommand';
import { UpdateFeatureCommand } from '@contexts/feature/application/command/updateFeature/updateFeatureCommand';
import { DeleteFeatureCommand } from '@contexts/feature/application/command/deleteFeature/deleteFeatureCommand';
import { GetFeatureByIdQuery } from '@contexts/feature/application/query/getFeatureById/getFeatureByIdQuery';
import { GetFeaturesByOwnerQuery } from '@contexts/feature/application/query/getFeaturesByOwner/getFeaturesByOwnerQuery';
import { requireRole, requirePrivateRead } from '@shared/infrastructure/http/roleGuard';
import { UserRole } from '@shared/domain/valueObject/userRole';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };
type DocumentBody = { name: string; url: string; type: string };

export const featureRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Params: { ownerType: string; ownerId: string } }>(
        '/features/by-owner/:ownerType/:ownerId',
        { preHandler: requirePrivateRead },
        async (req, reply) => {
            const { ownerType, ownerId } = req.params;
            const result = await queryBus.dispatch(new GetFeaturesByOwnerQuery(ownerType, ownerId));
            return reply.send(result);
        },
    );

    // Conservée pour ne pas casser les appelants qui ne connaissent qu'un projet.
    app.get<{ Params: { projectId: string } }>(
        '/features/by-project/:projectId',
        { preHandler: requirePrivateRead },
        async (req, reply) => {
            const result = await queryBus.dispatch(new GetFeaturesByOwnerQuery('project', req.params.projectId));
            return reply.send(result);
        },
    );

    // Volontairement ouverte : le site public la lit via les jetons de liaison des widgets
    // texte (content-renderer/dataBinding.tsx). Dette assumée — n'importe quel id est
    // lisible, y compris sous un projet non `visible`.
    app.get<{ Params: { id: string } }>('/features/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetFeatureByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{
        Body: {
            ownerType?: string;
            ownerId?: string;
            projectId?: string;
            name: string;
            description: string;
            documents: DocumentBody[];
        };
    }>(
        '/features',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'description', 'documents'],
                    properties: {
                        ownerType: { type: 'string', enum: ['project', 'idea'] },
                        ownerId: { type: 'string' },
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
            const { ownerType, ownerId, projectId, name, description, documents } = req.body;
            // `projectId` reste accepté : c'est la forme qu'envoient les écrans déjà en place.
            const owner =
                ownerId != null
                    ? { type: ownerType ?? 'project', id: ownerId }
                    : { type: 'project', id: projectId ?? '' };
            const id = crypto.randomUUID();
            const docsWithId = documents.map(d => ({ ...d, id: crypto.randomUUID() }));
            await commandBus.dispatch(
                new CreateFeatureCommand(id, owner.type, owner.id, name, description, docsWithId),
            );
            return reply.status(201).send({ id });
        },
    );

    app.patch<{ Params: { id: string }; Body: { name: string; description: string } }>(
        '/features/:id',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'description'],
                    properties: {
                        name: { type: 'string', minLength: 1 },
                        description: { type: 'string' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { name, description } = req.body;
            await commandBus.dispatch(new UpdateFeatureCommand(req.params.id, name, description));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string } }>(
        '/features/:id',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            await commandBus.dispatch(new DeleteFeatureCommand(req.params.id));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: DocumentBody }>(
        '/features/:id/documents',
        {
            preHandler: requireRole(UserRole.EDIT),
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
                new AddFeatureDocumentCommand(req.params.id, crypto.randomUUID(), name, url, type),
            );
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; documentId: string } }>(
        '/features/:id/documents/:documentId',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            await commandBus.dispatch(new RemoveFeatureDocumentCommand(req.params.id, req.params.documentId));
            return reply.status(204).send();
        },
    );
};
