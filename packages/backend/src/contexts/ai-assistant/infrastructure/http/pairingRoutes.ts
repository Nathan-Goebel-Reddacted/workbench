import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { requireRole } from '@shared/infrastructure/http/roleGuard';
import { CreateAgentToolCommand } from '@contexts/ai-assistant/application/command/createAgentTool/createAgentToolCommand';
import { RotateAgentToolTokenCommand } from '@contexts/ai-assistant/application/command/rotateAgentToolToken/rotateAgentToolTokenCommand';
import { issueAgentToken } from '@contexts/ai-assistant/application/auth/agentToken';
import {
    formatPairingCode,
    generatePairingCode,
    normalizePairingCode,
    PAIRING_TTL_MS,
} from '@contexts/ai-assistant/application/auth/pairingCode';
import {
    AgentPairingRequestRepository,
    TooManyPendingPairingRequests,
} from '@contexts/ai-assistant/infrastructure/repository/agentPairingRequestRepository';
import { ScopeValue } from '@contexts/ai-assistant/domain/valueObject/scope';
import { PermissionValue } from '@contexts/ai-assistant/domain/valueObject/permission';
import { UserRole } from '@shared/domain/valueObject/userRole';

type Opts = { commandBus: CommandBus; pairingRepo: AgentPairingRequestRepository };

export const pairingRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, pairingRepo }) => {
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
            const code = generatePairingCode();
            const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);

            try {
                await pairingRepo.create(name, scopes, permission, code, expiresAt);
            } catch (err: unknown) {
                if (err instanceof TooManyPendingPairingRequests) {
                    return reply.status(429).send({ error: 'Too many pending pairing requests' });
                }
                throw err;
            }

            // The code is returned once, to the caller only. Approving it is a human decision.
            return reply.status(201).send({
                code: formatPairingCode(code),
                expiresAt: expiresAt.toISOString(),
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
            const code = normalizePairingCode(req.body.code);
            const request = await pairingRepo.findByCode(code);

            // Unknown, expired and already-claimed codes answer identically: a caller must not be
            // able to tell a wrong code from one that is merely still waiting for approval.
            if (!request || request.expiresAt < new Date()) {
                return reply.status(404).send({ error: 'Unknown or expired pairing code' });
            }

            if (request.status === 'pending') {
                return reply.status(202).send({ status: 'pending' });
            }

            if (request.status !== 'approved' || !request.agentToolId) {
                return reply.status(404).send({ error: 'Unknown or expired pairing code' });
            }

            // The secret is minted here, at the only moment it can reach the agent.
            const { secret, token } = issueAgentToken(request.agentToolId);
            await commandBus.dispatch(new RotateAgentToolTokenCommand(request.agentToolId, secret));
            await pairingRepo.setStatus(request.id, 'claimed');

            return reply.send({ status: 'approved', token });
        },
    );

    // ── Côté administration ────────────────────────────────────────────────────────

    app.get('/agent-pairing-requests', { preHandler: requireRole(UserRole.EDIT) }, async (_req, reply) => {
        const requests = await pairingRepo.listPending();
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
            const request = await pairingRepo.findById(req.params.id);
            if (!request) return reply.status(404).send({ error: 'Pairing request not found' });
            if (request.status !== 'pending') {
                return reply.status(409).send({ error: `Request is already ${request.status}` });
            }

            // What the agent asked for is a suggestion: the granted scopes are the ones chosen here.
            const scopes = req.body?.scopes ?? request.requestedScopes;
            const permission = req.body?.permission ?? request.requestedPermission;

            const agentToolId = crypto.randomUUID();
            // A throwaway secret: the real one is minted when the agent claims it.
            const { secret } = issueAgentToken(agentToolId);
            await commandBus.dispatch(
                new CreateAgentToolCommand(agentToolId, req.body!.userId, request.name, permission, scopes, secret),
            );
            await pairingRepo.approve(request.id, agentToolId);

            return reply.status(200).send({ agentToolId, scopes, permission });
        },
    );

    app.post<{ Params: { id: string } }>(
        '/agent-pairing-requests/:id/reject',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            const request = await pairingRepo.findById(req.params.id);
            if (!request) return reply.status(404).send({ error: 'Pairing request not found' });

            await pairingRepo.setStatus(request.id, 'rejected');
            return reply.status(204).send();
        },
    );
};
