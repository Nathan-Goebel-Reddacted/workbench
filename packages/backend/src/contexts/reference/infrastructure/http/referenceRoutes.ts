import { FastifyPluginAsync } from 'fastify';
import { QueryBus } from '@shared/application/query/queryBus';
import { ResolveReferenceQuery } from '@contexts/reference/application/query/resolveReference/resolveReferenceQuery';
import { GetReferenceTreeQuery } from '@contexts/reference/application/query/getReferenceTree/getReferenceTreeQuery';
import { requireRole } from '@shared/infrastructure/http/roleGuard';

type Opts = { queryBus: QueryBus };

/**
 * Ces deux routes montrent l'atelier en entier — projets non publiés et idées comprises. Elles
 * sont donc gardées : sans cela, tout visiteur anonyme y accéderait, les GET n'étant pas
 * authentifiés par défaut.
 */
export const referenceRoutes: FastifyPluginAsync<Opts> = async (app, { queryBus }) => {
    app.get<{ Params: { reference: string } }>(
        '/references/:reference',
        { preHandler: requireRole('view', 'edit') },
        async (req, reply) => {
            const result = await queryBus.dispatch(new ResolveReferenceQuery(req.params.reference));
            return reply.send(result);
        },
    );

    app.get('/references', { preHandler: requireRole('view', 'edit') }, async (_req, reply) => {
        const result = await queryBus.dispatch(new GetReferenceTreeQuery());
        return reply.send(result);
    });
};
