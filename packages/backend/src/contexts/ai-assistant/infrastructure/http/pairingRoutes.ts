import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { requireRole } from '@shared/infrastructure/http/roleGuard';
import {
    RequestPairingCommand,
    IssuedPairing,
} from '@contexts/ai-assistant/application/command/requestPairing/requestPairingCommand';
import {
    ClaimPairingRequestCommand,
    ClaimOutcome,
} from '@contexts/ai-assistant/application/command/claimPairingRequest/claimPairingRequestCommand';
import {
    ApprovePairingRequestCommand,
    ApprovalOutcome,
} from '@contexts/ai-assistant/application/command/approvePairingRequest/approvePairingRequestCommand';
import { RejectPairingRequestCommand } from '@contexts/ai-assistant/application/command/rejectPairingRequest/rejectPairingRequestCommand';
import { ListPairingRequestsQuery } from '@contexts/ai-assistant/application/query/listPairingRequests/listPairingRequestsQuery';
import { PairingRequestDto } from '@contexts/ai-assistant/application/query/listPairingRequests/pairingRequestDto';
import { TooManyPendingPairingRequests } from '@contexts/ai-assistant/domain/exception/tooManyPendingPairingRequests';
import { formatPairingCode } from '@contexts/ai-assistant/domain/valueObject/pairingCode';
import { ScopeValue } from '@contexts/ai-assistant/domain/valueObject/scope';
import { PermissionValue } from '@contexts/ai-assistant/domain/valueObject/permission';
import { UserRole } from '@shared/domain/valueObject/userRole';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

export const pairingRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    // ── Côté agent (public) ────────────────────────────────────────────────────────

    app.post<{ Body: { name: string; scopes: string[]; permission: string } }>(
        '/mcp/pair',
        {
            config: { public: true, rateLimit: { max: 10, timeWindow: '15 minutes' } },
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'scopes', 'permission'],
                    properties: {
                        name: { type: 'string', minLength: 1, maxLength: 100 },
                        scopes: {
                            type: 'array',
                            minItems: 1,
                            items: { type: 'string', enum: Object.values(ScopeValue) },
                        },
                        permission: { type: 'string', enum: Object.values(PermissionValue) },
                    },
                },
            },
        },
        async (req, reply) => {
            const { name, scopes, permission } = req.body;

            let issued: IssuedPairing;
            try {
                issued = await commandBus.dispatch<RequestPairingCommand, IssuedPairing>(
                    new RequestPairingCommand(name, scopes, permission),
                );
            } catch (err: unknown) {
                // La file pleine n'est pas un refus métier : la demande était recevable.
                if (err instanceof TooManyPendingPairingRequests) {
                    return reply.status(429).send({ error: 'Too many pending pairing requests' });
                }
                throw err;
            }

            // The code is returned once, to the caller only. Approving it is a human decision.
            return reply.status(201).send({
                code: formatPairingCode(issued.code),
                expiresAt: issued.expiresAt.toISOString(),
            });
        },
    );

    app.post<{ Body: { code: string } }>(
        '/mcp/pair/claim',
        {
            // Cette route délivre le secret de l'agent contre un code court : sans plafond,
            // le code se devine par énumération.
            config: { public: true, rateLimit: { max: 10, timeWindow: '15 minutes' } },
            schema: {
                body: {
                    type: 'object',
                    required: ['code'],
                    properties: { code: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            const outcome = await commandBus.dispatch<ClaimPairingRequestCommand, ClaimOutcome>(
                new ClaimPairingRequestCommand(req.body.code),
            );

            if (outcome.status === 'unknown') {
                return reply.status(404).send({ error: 'Unknown or expired pairing code' });
            }
            if (outcome.status === 'pending') {
                return reply.status(202).send({ status: 'pending' });
            }

            return reply.send({ status: 'approved', token: outcome.token });
        },
    );

    // ── Côté administration ────────────────────────────────────────────────────────

    app.get('/agent-pairing-requests', { preHandler: requireRole(UserRole.EDIT) }, async (_req, reply) => {
        const requests = await queryBus.dispatch<ListPairingRequestsQuery, PairingRequestDto[]>(
            new ListPairingRequestsQuery(),
        );
        return reply.send({ requests });
    });

    app.post<{ Params: { id: string }; Body?: { userId: string; scopes?: string[]; permission?: string } }>(
        '/agent-pairing-requests/:id/approve',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['userId'],
                    properties: {
                        userId: { type: 'string' },
                        scopes: { type: 'array', items: { type: 'string', enum: Object.values(ScopeValue) } },
                        permission: { type: 'string', enum: Object.values(PermissionValue) },
                    },
                },
            },
        },
        async (req, reply) => {
            const outcome = await commandBus.dispatch<ApprovePairingRequestCommand, ApprovalOutcome | null>(
                new ApprovePairingRequestCommand(
                    req.params.id,
                    req.body!.userId,
                    req.body?.scopes,
                    req.body?.permission,
                ),
            );

            if (!outcome) return reply.status(404).send({ error: 'Pairing request not found' });
            if (outcome.outcome === 'alreadyDecided') {
                return reply.status(409).send({ error: `Request is already ${outcome.status}` });
            }

            return reply.status(200).send({
                agentToolId: outcome.agentToolId,
                scopes: outcome.scopes,
                permission: outcome.permission,
            });
        },
    );

    app.post<{ Params: { id: string } }>(
        '/agent-pairing-requests/:id/reject',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            const rejected = await commandBus.dispatch<RejectPairingRequestCommand, boolean>(
                new RejectPairingRequestCommand(req.params.id),
            );

            if (!rejected) return reply.status(404).send({ error: 'Pairing request not found' });
            return reply.status(204).send();
        },
    );
};
