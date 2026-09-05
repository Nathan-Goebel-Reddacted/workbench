import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { requireRole } from '@shared/infrastructure/http/roleGuard.js';
import { ErrorLogRecorder } from '@contexts/errorLog/application/errorLogRecorder';
import { IErrorLogRepository, ErrorLogSearch } from '@contexts/errorLog/domain/repository/iErrorLogRepository';
import {
    ErrorLogEntry,
    MAX_MESSAGE_LENGTH,
    MAX_STACK_LENGTH,
    MAX_URL_LENGTH,
} from '@contexts/errorLog/domain/errorLogEntryAggregate';

type Opts = { repository: IErrorLogRepository; recorder: ErrorLogRecorder };

type ReportBody = {
    message: string;
    stack?: string;
    url?: string;
    context?: Record<string, unknown>;
    occurredAt?: string;
};

type SearchQuery = {
    origin?: 'front' | 'back';
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

function toDto(entry: ErrorLogEntry) {
    return {
        id: entry.getId(),
        origin: entry.getOrigin(),
        message: entry.getMessage(),
        stack: entry.getStack(),
        url: entry.getUrl(),
        userId: entry.getUserId(),
        correlationId: entry.getCorrelationId(),
        context: entry.getContext(),
        occurredAt: entry.getOccurredAt().toISOString(),
    };
}

function parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

/** The guard hook leaves POST /error-log open, so the session has to be read here if there is one. */
async function optionalUserId(req: FastifyRequest): Promise<string | null> {
    try {
        await req.jwtVerify();
        return req.user?.sub ?? null;
    } catch {
        return null;
    }
}

export const errorLogRoutes: FastifyPluginAsync<Opts> = async (app, { repository, recorder }) => {
    app.post<{ Body: ReportBody }>(
        '/error-log',
        {
            schema: { body: reportSchema },
            config: { rateLimit: { max: 30, timeWindow: '5 minutes' } },
            bodyLimit: 32 * 1024,
        },
        async (req, reply) => {
            const { message, stack, url, context, occurredAt } = req.body;

            await recorder.record({
                origin: 'front',
                message,
                stack,
                url,
                userId: await optionalUserId(req),
                context: { ...context, userAgent: req.headers['user-agent'] ?? null },
                occurredAt: parseDate(occurredAt),
            });

            return reply.status(204).send();
        },
    );

    app.get<{ Querystring: SearchQuery }>('/error-log', { preHandler: requireRole('edit') }, async req => {
        const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
        const offset = Math.max(Number(req.query.offset) || 0, 0);

        const criteria: ErrorLogSearch = {
            origin: req.query.origin,
            from: parseDate(req.query.from),
            to: parseDate(req.query.to),
            query: req.query.q?.trim() || undefined,
            limit,
            offset,
        };

        const page = await repository.search(criteria);
        return { entries: page.entries.map(toDto), total: page.total, limit, offset };
    });

    app.delete<{ Querystring: { before?: string } }>('/error-log', { preHandler: requireRole('edit') }, async req => ({
        deleted: await repository.purge(parseDate(req.query.before)),
    }));
};
