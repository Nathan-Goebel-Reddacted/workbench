import { describe, expect, it } from 'vitest';
import { DeleteIdeaHandler } from './deleteIdeaHandler.js';
import { DeleteIdeaCommand } from './deleteIdeaCommand.js';
import { FakeTransactionRunner } from '@shared/application/port/transactionRunnerDouble.js';
import type { IIdeaRepository } from '../../../domain/repository/iIdeaRepository.js';
import type { IIdeaFeaturesGateway } from '../../../domain/port/iIdeaFeaturesGateway.js';
import type { IUploadStorage } from '@shared/application/port/iUploadStorage.js';
import type { Idea } from '../../../domain/ideaAggregate.js';

// La cascade la plus profonde de l'application : idée → features → tickets. Un incident en
// cours de route laisserait un porteur amputé d'une partie de ses features, sans trace de
// lesquelles. C'est ce que la frontière transactionnelle vérifiée ici empêche.

type Trace = string[];

function repository(trace: Trace, tx: FakeTransactionRunner, onDelete?: () => never): IIdeaRepository {
    return {
        findById: async () => ({ getDocuments: () => [{ getUrl: () => '/uploads/idea.png' }] }) as unknown as Idea,
        findAll: async () => [],
        existsById: async () => true,
        save: async () => {},
        delete: async () => {
            trace.push(`delete:idea(tx=${tx.inTransaction})`);
            onDelete?.();
        },
    } as unknown as IIdeaRepository;
}

function features(trace: Trace, tx: FakeTransactionRunner): IIdeaFeaturesGateway {
    return {
        countOf: async () => ({ features: 2, tickets: 5 }),
        deleteAllOf: async () => {
            trace.push(`delete:features(tx=${tx.inTransaction})`);
            return ['/uploads/ticket.png'];
        },
        transferToProject: async () => {},
    };
}

function uploads(trace: Trace, tx: FakeTransactionRunner): IUploadStorage {
    return {
        release: async urls => {
            trace.push(`release:${urls.join(',')}(tx=${tx.inTransaction})`);
        },
        releaseFromContent: async () => {},
    };
}

describe('DeleteIdeaHandler', () => {
    it('supprime les features puis l’idée dans une seule transaction', async () => {
        const trace: Trace = [];
        const tx = new FakeTransactionRunner();
        const handler = new DeleteIdeaHandler(repository(trace, tx), features(trace, tx), uploads(trace, tx), tx);

        await handler.handle(new DeleteIdeaCommand('i1'));

        expect(trace).toEqual([
            'delete:features(tx=true)',
            'delete:idea(tx=true)',
            'release:/uploads/ticket.png,/uploads/idea.png(tx=false)',
        ]);
        expect(tx.committed).toBe(1);
    });

    it('abandonne la transaction si la suppression de l’idée échoue', async () => {
        const trace: Trace = [];
        const tx = new FakeTransactionRunner();
        const boom = () => {
            throw new Error('idea delete failed');
        };
        const handler = new DeleteIdeaHandler(repository(trace, tx, boom), features(trace, tx), uploads(trace, tx), tx);

        await expect(handler.handle(new DeleteIdeaCommand('i1'))).rejects.toThrow('idea delete failed');

        expect(tx.rolledBack).toBe(1);
        expect(trace.some(line => line.startsWith('release:'))).toBe(false);
    });
});
