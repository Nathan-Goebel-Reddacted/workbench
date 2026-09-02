import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { requireRole, hasPrivateRead } from '@shared/infrastructure/http/roleGuard';
import { CreateCvCommand } from '@contexts/cv/application/command/createCv/createCvCommand';
import { DeleteCvCommand } from '@contexts/cv/application/command/deleteCv/deleteCvCommand';
import { SetCvVisibilityCommand } from '@contexts/cv/application/command/setCvVisibility/setCvVisibilityCommand';
import { ReorderCvsCommand } from '@contexts/cv/application/command/reorderCvs/reorderCvsCommand';
import { ListCvsQuery } from '@contexts/cv/application/query/listCvs/listCvsQuery';
import { CvError } from '@contexts/cv/domain/cvAggregate';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

export const cvRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get('/cvs', async (req, reply) => {
        const result = await queryBus.dispatch(new ListCvsQuery(hasPrivateRead(req)));
        return reply.send(result);
    });

    app.post<{ Body: { name: string; fileUrl: string } }>(
        '/cvs',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'fileUrl'],
                    properties: {
                        name: { type: 'string', minLength: 1, maxLength: 255 },
                        fileUrl: { type: 'string', minLength: 1 },
                    },
                },
            },
        },
        async (req, reply) => {
            const id = crypto.randomUUID();
            try {
                await commandBus.dispatch(new CreateCvCommand(id, req.body.name, req.body.fileUrl));
            } catch (error) {
                if (error instanceof CvError) return reply.status(400).send({ error: error.message });
                throw error;
            }
            return reply.status(201).send({ id });
        },
    );

    app.put<{ Body: { ids: string[] } }>(
        '/cvs/order',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['ids'],
                    properties: {
                        ids: { type: 'array', items: { type: 'string' } },
                    },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new ReorderCvsCommand(req.body.ids));
            return reply.status(204).send();
        },
    );

    app.patch<{ Params: { id: string }; Body: { visible: boolean } }>(
        '/cvs/:id',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['visible'],
                    properties: {
                        visible: { type: 'boolean' },
                    },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new SetCvVisibilityCommand(req.params.id, req.body.visible));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string } }>('/cvs/:id', { preHandler: requireRole('edit') }, async (req, reply) => {
        await commandBus.dispatch(new DeleteCvCommand(req.params.id));
        return reply.status(204).send();
    });
};
