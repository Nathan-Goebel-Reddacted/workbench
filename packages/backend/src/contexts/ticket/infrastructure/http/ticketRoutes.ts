import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateTicketCommand } from '@contexts/ticket/application/command/createTicket/createTicketCommand';
import { ChangeTicketStatusCommand } from '@contexts/ticket/application/command/changeTicketStatus/changeTicketStatusCommand';
import { UpdateTicketCommand } from '@contexts/ticket/application/command/updateTicket/updateTicketCommand';
import { UpdateTicketNoteCommand } from '@contexts/ticket/application/command/updateTicketNote/updateTicketNoteCommand';
import { DeleteTicketCommand } from '@contexts/ticket/application/command/deleteTicket/deleteTicketCommand';
import { AddTicketNoteCommand } from '@contexts/ticket/application/command/addTicketNote/addTicketNoteCommand';
import { AddTicketDocumentCommand } from '@contexts/ticket/application/command/addTicketDocument/addTicketDocumentCommand';
import { RemoveTicketDocumentCommand } from '@contexts/ticket/application/command/removeTicketDocument/removeTicketDocumentCommand';
import { GetTicketByIdQuery } from '@contexts/ticket/application/query/getTicketById/getTicketByIdQuery';
import { GetTicketsByFeatureIdQuery } from '@contexts/ticket/application/query/getTicketsByFeatureId/getTicketsByFeatureIdQuery';
import { requireRole, requirePrivateRead } from '@shared/infrastructure/http/roleGuard';
import { TicketStatus } from '@contexts/ticket/domain/valueObject/status';
import { UserRole } from '@shared/domain/valueObject/userRole';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };
type DocumentBody = { name: string; url: string; type: string };

export const ticketRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Params: { featureId: string } }>(
        '/tickets/by-feature/:featureId',
        { preHandler: requirePrivateRead },
        async (req, reply) => {
            const result = await queryBus.dispatch(new GetTicketsByFeatureIdQuery(req.params.featureId));
            return reply.send(result);
        },
    );

    // Volontairement ouverte, même raison que GET /features/:id : jetons de liaison du
    // site public. Dette assumée.
    app.get<{ Params: { id: string } }>('/tickets/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetTicketByIdQuery(req.params.id));
        return reply.send(result);
    });

    // `featureRef` a disparu du contrat : la référence se déduit de la feature et de son porteur,
    // le client n'a plus à inventer de préfixe.
    app.post<{ Body: { featureId: string; title: string; description: string } }>(
        '/tickets',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['featureId', 'title', 'description'],
                    properties: {
                        featureId: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { featureId, title, description } = req.body;
            const id = crypto.randomUUID();
            await commandBus.dispatch(new CreateTicketCommand(id, featureId, title, description));
            const created = await queryBus.dispatch(new GetTicketByIdQuery(id));
            return reply.status(201).send(created);
        },
    );

    app.patch<{ Params: { id: string }; Body: { title: string; description: string } }>(
        '/tickets/:id',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['title', 'description'],
                    properties: {
                        title: { type: 'string', minLength: 1 },
                        description: { type: 'string' },
                    },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new UpdateTicketCommand(req.params.id, req.body.title, req.body.description));
            return reply.status(204).send();
        },
    );

    app.patch<{ Params: { id: string }; Body: { status: string } }>(
        '/tickets/:id/status',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['status'],
                    properties: { status: { type: 'string', enum: Object.values(TicketStatus) } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new ChangeTicketStatusCommand(req.params.id, req.body.status));
            return reply.status(204).send();
        },
    );

    app.patch<{ Params: { id: string; index: string }; Body: { note: string } }>(
        '/tickets/:id/notes/:index',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['note'],
                    properties: { note: { type: 'string', minLength: 1 } },
                },
            },
        },
        async (req, reply) => {
            const index = parseInt(req.params.index, 10);
            if (isNaN(index)) return reply.status(400).send({ error: 'Note index must be a number' });
            await commandBus.dispatch(new UpdateTicketNoteCommand(req.params.id, index, req.body.note));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: { note: string } }>(
        '/tickets/:id/notes',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['note'],
                    properties: { note: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new AddTicketNoteCommand(req.params.id, req.body.note));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: DocumentBody }>(
        '/tickets/:id/documents',
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
                new AddTicketDocumentCommand(req.params.id, crypto.randomUUID(), name, url, type),
            );
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string } }>(
        '/tickets/:id',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            await commandBus.dispatch(new DeleteTicketCommand(req.params.id));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; documentId: string } }>(
        '/tickets/:id/documents/:documentId',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            await commandBus.dispatch(new RemoveTicketDocumentCommand(req.params.id, req.params.documentId));
            return reply.status(204).send();
        },
    );
};
