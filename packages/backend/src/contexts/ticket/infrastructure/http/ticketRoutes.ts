import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateTicketCommand } from '@contexts/ticket/application/command/createTicket/createTicketCommand';
import { ChangeTicketStatusCommand } from '@contexts/ticket/application/command/changeTicketStatus/changeTicketStatusCommand';
import { AddTicketNoteCommand } from '@contexts/ticket/application/command/addTicketNote/addTicketNoteCommand';
import { AddTicketDocumentCommand } from '@contexts/ticket/application/command/addTicketDocument/addTicketDocumentCommand';
import { RemoveTicketDocumentCommand } from '@contexts/ticket/application/command/removeTicketDocument/removeTicketDocumentCommand';
import { GetTicketByIdQuery } from '@contexts/ticket/application/query/getTicketById/getTicketByIdQuery';
import { GetTicketsByFeatureIdQuery } from '@contexts/ticket/application/query/getTicketsByFeatureId/getTicketsByFeatureIdQuery';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };
type DocumentBody = { name: string; url: string; type: string };

export const ticketRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Params: { featureId: string } }>('/tickets/by-feature/:featureId', async (req, reply) => {
        const result = await queryBus.dispatch(new GetTicketsByFeatureIdQuery(req.params.featureId));
        return reply.send(result);
    });

    app.get<{ Params: { id: string } }>('/tickets/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetTicketByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{ Body: { featureId: string; featureRef: string; title: string; description: string } }>(
        '/tickets',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['featureId', 'featureRef', 'title', 'description'],
                    properties: {
                        featureId: { type: 'string' },
                        featureRef: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { featureId, featureRef, title, description } = req.body;
            const id = crypto.randomUUID();
            await commandBus.dispatch(new CreateTicketCommand(id, featureId, featureRef, title, description));
            return reply.status(201).send({ id });
        },
    );

    app.patch<{ Params: { id: string }; Body: { status: string } }>(
        '/tickets/:id/status',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['status'],
                    properties: { status: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new ChangeTicketStatusCommand(req.params.id, req.body.status));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: { note: string } }>(
        '/tickets/:id/notes',
        {
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
            await commandBus.dispatch(new AddTicketDocumentCommand(req.params.id, crypto.randomUUID(), name, url, type));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; documentId: string } }>(
        '/tickets/:id/documents/:documentId',
        async (req, reply) => {
            await commandBus.dispatch(new RemoveTicketDocumentCommand(req.params.id, req.params.documentId));
            return reply.status(204).send();
        },
    );
};
