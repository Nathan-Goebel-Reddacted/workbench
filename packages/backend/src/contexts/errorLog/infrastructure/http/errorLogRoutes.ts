import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { requireRole } from '@shared/infrastructure/http/roleGuard.js';
import { UserRole } from '@shared/domain/valueObject/userRole.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { RecordErrorLogEntryCommand } from '@contexts/errorLog/application/command/recordErrorLogEntry/recordErrorLogEntryCommand.js';
import { PurgeErrorLogCommand } from '@contexts/errorLog/application/command/purgeErrorLog/purgeErrorLogCommand.js';
import { SearchErrorLogQuery } from '@contexts/errorLog/application/query/searchErrorLog/searchErrorLogQuery.js';
import { ErrorLogPageDto } from '@contexts/errorLog/application/query/searchErrorLog/errorLogEntryDto.js';
import { ErrorOrigin } from '@contexts/errorLog/domain/valueObject/errorOrigin.js';
import {
    MAX_MESSAGE_LENGTH,
    MAX_STACK_LENGTH,
    MAX_URL_LENGTH,
} from '@contexts/errorLog/domain/valueObject/boundedText.js';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

type ReportBody = {
    message: string;
    stack?: string;
    url?: string;
    context?: Record<string, unknown>;
    occurredAt?: string;
};

type SearchQuery = {
    origin?: ErrorOrigin;
    from?: string;
    to?: string;
    q?: string;
    limit?: number;
    offset?: number;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const reportSchema = {
    type: 'object',
    required: ['message'],
    properties: {
        message: { type: 'string', maxLength: MAX_MESSAGE_LENGTH },
        stack: { type: 'string', maxLength: MAX_STACK_LENGTH },
        url: { type: 'string', maxLength: MAX_URL_LENGTH },
        context: { type: 'object' },
        occurredAt: { type: 'string' },
    },
    additionalProperties: false,
} as const;

function parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

/** La route est publique : s'il y a une session, elle doit être lue ici. */
async function optionalUserId(req: FastifyRequest): Promise<string | null> {
    try {
        await req.jwtVerify();
        return req.user?.sub ?? null;
    } catch {
        return null;
    }
}

export const errorLogRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.post<{ Body: ReportBody }>(
        '/error-log',
        {
            schema: { body: reportSchema },
            config: { public: true, rateLimit: { max: 30, timeWindow: '5 minutes' } },
            bodyLimit: 32 * 1024,
        },
        async (req, reply) => {
            const { message, stack, url, context, occurredAt } = req.body;

            await commandBus.dispatch(
                new RecordErrorLogEntryCommand(ErrorOrigin.FRONT, message, {
                    stack,
                    url,
                    userId: await optionalUserId(req),
                    context: { ...context, userAgent: req.headers['user-agent'] ?? null },
                    occurredAt: parseDate(occurredAt),
                }),
            );

            return reply.status(204).send();
        },
    );

    app.get<{ Querystring: SearchQuery }>('/error-log', { preHandler: requireRole(UserRole.EDIT) }, async req => {
        const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
        const offset = Math.max(Number(req.query.offset) || 0, 0);

        return queryBus.dispatch<SearchErrorLogQuery, ErrorLogPageDto>(
            new SearchErrorLogQuery({
                origin: req.query.origin,
                from: parseDate(req.query.from),
                to: parseDate(req.query.to),
                query: req.query.q?.trim() || undefined,
                limit,
                offset,
            }),
        );
    });

    app.delete<{ Querystring: { before?: string } }>(
        '/error-log',
        { preHandler: requireRole(UserRole.EDIT) },
        async req => ({
            deleted: await commandBus.dispatch<PurgeErrorLogCommand, number>(
                new PurgeErrorLogCommand(parseDate(req.query.before)),
            ),
        }),
    );
};
