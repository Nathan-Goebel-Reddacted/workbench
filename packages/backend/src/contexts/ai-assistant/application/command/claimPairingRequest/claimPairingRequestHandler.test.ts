import { describe, expect, it } from 'vitest';
import { ClaimPairingRequestHandler } from './claimPairingRequestHandler.js';
import { ClaimPairingRequestCommand } from './claimPairingRequestCommand.js';
import { PairingRequestFactory } from '../../../domain/factory/pairingRequestFactory.js';
import { AgentToolFactory } from '../../../domain/factory/agentToolFactory.js';
import { AgentToolId } from '../../../domain/valueObject/agentToolId.js';
import { PairingStatusValue } from '../../../domain/valueObject/pairingStatus.js';
import { FakeTransactionRunner } from '@shared/application/port/transactionRunnerDouble.js';
import type { AgentTool } from '../../../domain/agentToolAggregate.js';
import type { PairingRequest } from '../../../domain/pairingRequestAggregate.js';
import type { ISecretHasher } from '../../../domain/port/iSecretHasher.js';
import type { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository.js';
import type { IPairingRequestRepository } from '../../../domain/repository/iPairingRequestRepository.js';

// Réclamer, c'est frapper le jeton ET consommer la demande. Les deux écritures étaient
// séparées : une panne entre elles rendait à l'agent un jeton que la base n'avait pas
// enregistré, ou laissait la demande réclamable une seconde fois alors qu'un jeton était parti.

const CODE = 'ABCD2345';
const USER_ID = '11111111-1111-4111-8111-111111111111';

const hasher: ISecretHasher = {
    hash: async secret => `hashed:${secret}`,
    matches: async (candidate, hashed) => hashed === `hashed:${candidate}`,
};

async function approvedPair(): Promise<{ request: PairingRequest; tool: AgentTool; toolId: AgentToolId }> {
    const request = await new PairingRequestFactory(hasher).create('Claude Code', ['project'], 'read', CODE);
    const toolId = new AgentToolId();
    const tool = await new AgentToolFactory(hasher).create(
        toolId.getValue(),
        USER_ID,
        'Claude Code',
        'read',
        ['project'],
        'secret-initial',
    );
    request.approve(toolId);
    return { request, tool, toolId };
}

function agentTools(stored: AgentTool | null, options: { failsWith?: Error } = {}) {
    const saved: AgentTool[] = [];
    const repo: IAgentToolRepository = {
        findById: async () => stored,
        findByUserId: async () => (stored ? [stored] : []),
        findAll: async () => (stored ? [stored] : []),
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
        countPending: async () => 0,
        deleteExpired: async () => {},
        save: async request => {
            if (options.failsWith) throw options.failsWith;
            saved.push(request);
        },
    };
    return { repo, saved };
}

describe('ClaimPairingRequestHandler', () => {
    it('frappe le jeton et consomme la demande dans une seule transaction', async () => {
        const { request, tool } = await approvedPair();
        const r = requests(request);
        const a = agentTools(tool);
        const tx = new FakeTransactionRunner();

        const outcome = await new ClaimPairingRequestHandler(r.repo, a.repo, hasher, tx).handle(
            new ClaimPairingRequestCommand(CODE),
        );

        expect(outcome.status).toBe('approved');
        expect(request.getStatus()).toBe(PairingStatusValue.CLAIMED);
        expect(a.saved).toHaveLength(1);
        expect(r.saved).toHaveLength(1);
        expect(tx.committed).toBe(1);
    });

    it('accepte le code retapé avec tiret et minuscules', async () => {
        const { request, tool } = await approvedPair();
        const tx = new FakeTransactionRunner();

        const outcome = await new ClaimPairingRequestHandler(
            requests(request).repo,
            agentTools(tool).repo,
            hasher,
            tx,
        ).handle(new ClaimPairingRequestCommand('abcd-2345'));

        expect(outcome.status).toBe('approved');
    });

    it('ne laisse pas partir un jeton que la demande n’a pas pu enregistrer', async () => {
        const { request, tool } = await approvedPair();
        const r = requests(request, { failsWith: new Error('database unreachable') });
        const a = agentTools(tool);
        const tx = new FakeTransactionRunner();

        await expect(
            new ClaimPairingRequestHandler(r.repo, a.repo, hasher, tx).handle(new ClaimPairingRequestCommand(CODE)),
        ).rejects.toThrow('database unreachable');

        expect(tx.rolledBack).toBe(1);
        expect(tx.committed).toBe(0);
    });

    it('écrit l’outil et la demande à l’intérieur de la transaction, jamais à côté', async () => {
        const { request, tool } = await approvedPair();
        const tx = new FakeTransactionRunner();
        const inside: boolean[] = [];

        const a = agentTools(tool);
        const r = requests(request);

        await new ClaimPairingRequestHandler(
            { ...r.repo, save: async () => void inside.push(tx.inTransaction) },
            { ...a.repo, save: async () => void inside.push(tx.inTransaction) },
            hasher,
            tx,
        ).handle(new ClaimPairingRequestCommand(CODE));

        expect(inside).toEqual([true, true]);
    });

    it('n’ouvre aucune transaction pour un code inconnu', async () => {
        const tx = new FakeTransactionRunner();

        const outcome = await new ClaimPairingRequestHandler(
            requests(null).repo,
            agentTools(null).repo,
            hasher,
            tx,
        ).handle(new ClaimPairingRequestCommand('ZZZZ9999'));

        expect(outcome.status).toBe('unknown');
        expect(tx.started).toBe(0);
    });

    it('n’ouvre aucune transaction tant que la demande attend une décision', async () => {
        const request = await new PairingRequestFactory(hasher).create('Claude Code', ['project'], 'read', CODE);
        const tx = new FakeTransactionRunner();

        const outcome = await new ClaimPairingRequestHandler(
            requests(request).repo,
            agentTools(null).repo,
            hasher,
            tx,
        ).handle(new ClaimPairingRequestCommand(CODE));

        expect(outcome.status).toBe('pending');
        expect(tx.started).toBe(0);
    });

    it('ne rend rien une seconde fois : une demande réclamée ne l’est plus', async () => {
        const { request, tool } = await approvedPair();
        const r = requests(request);
        const a = agentTools(tool);
        const tx = new FakeTransactionRunner();
        const handler = new ClaimPairingRequestHandler(r.repo, a.repo, hasher, tx);

        await handler.handle(new ClaimPairingRequestCommand(CODE));
        const second = await handler.handle(new ClaimPairingRequestCommand(CODE));

        expect(second.status).toBe('unknown');
        expect(tx.committed).toBe(1);
    });
});
