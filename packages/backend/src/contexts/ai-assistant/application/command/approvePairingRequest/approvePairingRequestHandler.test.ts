import { describe, expect, it } from 'vitest';
import { ApprovePairingRequestHandler } from './approvePairingRequestHandler.js';
import { ApprovePairingRequestCommand } from './approvePairingRequestCommand.js';
import { PairingRequestFactory } from '../../../domain/factory/pairingRequestFactory.js';
import { AgentToolFactory } from '../../../domain/factory/agentToolFactory.js';
import { PairingStatusValue } from '../../../domain/valueObject/pairingStatus.js';
import { FakeTransactionRunner } from '@shared/application/port/transactionRunnerDouble.js';
import type { AgentTool } from '../../../domain/agentToolAggregate.js';
import type { PairingRequest } from '../../../domain/pairingRequestAggregate.js';
import type { ISecretHasher } from '../../../domain/port/iSecretHasher.js';
import type { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository.js';
import type { IPairingRequestRepository } from '../../../domain/repository/iPairingRequestRepository.js';

// Approuver, c'est créer l'outil ET consommer la demande. Les deux écritures étaient séparées,
// chaque dépôt commitant la sienne : un incident entre elles laissait un outil orphelin —
// porteur d'un secret que personne n'avait reçu — pendant que la demande restait en attente.
// Réapprouver en fabriquait alors simplement un second.

const USER_ID = '11111111-1111-4111-8111-111111111111';

const hasher: ISecretHasher = {
    hash: async secret => `hashed:${secret}`,
    matches: async (candidate, hashed) => hashed === `hashed:${candidate}`,
};

function agentTools(options: { failsWith?: Error } = {}) {
    const saved: AgentTool[] = [];
    const repo: IAgentToolRepository = {
        findById: async () => null,
        findByUserId: async () => [],
        findAll: async () => [],
        save: async tool => {
            if (options.failsWith) throw options.failsWith;
            saved.push(tool);
        },
    };
    return { repo, saved };
}

function requests(stored: PairingRequest | null, options: { failsWith?: Error } = {}) {
    const saved: PairingRequest[] = [];
    const repo: IPairingRequestRepository = {
        findById: async () => stored,
        findByCodePrefix: async () => (stored ? [stored] : []),
        findOpen: async () => (stored ? [stored] : []),
        countPending: async () => (stored ? 1 : 0),
        deleteExpired: async () => {},
        save: async request => {
            if (options.failsWith) throw options.failsWith;
            saved.push(request);
        },
    };
    return { repo, saved };
}

async function pendingRequest(): Promise<PairingRequest> {
    return new PairingRequestFactory(hasher).create('Claude Code', ['project', 'idea'], 'read', 'ABCD2345');
}

function handler(
    r: ReturnType<typeof requests>,
    a: ReturnType<typeof agentTools>,
    tx: FakeTransactionRunner,
): ApprovePairingRequestHandler {
    return new ApprovePairingRequestHandler(r.repo, a.repo, new AgentToolFactory(hasher), tx);
}

describe('ApprovePairingRequestHandler', () => {
    it('crée l’outil et consomme la demande dans une seule transaction', async () => {
        const request = await pendingRequest();
        const r = requests(request);
        const a = agentTools();
        const tx = new FakeTransactionRunner();

        const outcome = await handler(r, a, tx).handle(
            new ApprovePairingRequestCommand(request.getId().getValue(), USER_ID),
        );

        expect(outcome).toMatchObject({ outcome: 'approved', scopes: ['project', 'idea'], permission: 'read' });
        expect(request.getStatus()).toBe(PairingStatusValue.APPROVED);
        expect(a.saved).toHaveLength(1);
        expect(r.saved).toHaveLength(1);
        expect(tx.committed).toBe(1);
    });

    it('n’abandonne pas d’outil orphelin quand la demande ne peut plus être écrite', async () => {
        const request = await pendingRequest();
        const r = requests(request, { failsWith: new Error('database unreachable') });
        const a = agentTools();
        const tx = new FakeTransactionRunner();

        await expect(
            handler(r, a, tx).handle(new ApprovePairingRequestCommand(request.getId().getValue(), USER_ID)),
        ).rejects.toThrow('database unreachable');

        expect(tx.rolledBack).toBe(1);
        expect(tx.committed).toBe(0);
    });

    it('écrit l’outil et la demande à l’intérieur de la transaction, jamais à côté', async () => {
        const request = await pendingRequest();
        const tx = new FakeTransactionRunner();
        const inside: boolean[] = [];

        const a = agentTools();
        const r = requests(request);
        const spied = {
            ...a,
            repo: { ...a.repo, save: async () => void inside.push(tx.inTransaction) },
        };
        const spiedRequests = {
            ...r,
            repo: { ...r.repo, save: async () => void inside.push(tx.inTransaction) },
        };

        await handler(spiedRequests, spied, tx).handle(
            new ApprovePairingRequestCommand(request.getId().getValue(), USER_ID),
        );

        expect(inside).toEqual([true, true]);
    });

    it('réduit les scopes et la permission quand l’approbation en impose', async () => {
        const request = await pendingRequest();
        const r = requests(request);
        const a = agentTools();
        const tx = new FakeTransactionRunner();

        const outcome = await handler(r, a, tx).handle(
            new ApprovePairingRequestCommand(request.getId().getValue(), USER_ID, ['project'], 'read'),
        );

        expect(outcome).toMatchObject({ scopes: ['project'], permission: 'read' });
    });

    it('n’ouvre aucune transaction quand la demande n’existe pas', async () => {
        const r = requests(null);
        const a = agentTools();
        const tx = new FakeTransactionRunner();

        expect(await handler(r, a, tx).handle(new ApprovePairingRequestCommand('inconnu', USER_ID))).toBeNull();
        expect(tx.started).toBe(0);
    });

    it('n’ouvre aucune transaction quand la demande est déjà décidée', async () => {
        const request = await pendingRequest();
        request.reject();
        const r = requests(request);
        const a = agentTools();
        const tx = new FakeTransactionRunner();

        const outcome = await handler(r, a, tx).handle(
            new ApprovePairingRequestCommand(request.getId().getValue(), USER_ID),
        );

        expect(outcome).toMatchObject({ outcome: 'alreadyDecided' });
        expect(tx.started).toBe(0);
    });
});
