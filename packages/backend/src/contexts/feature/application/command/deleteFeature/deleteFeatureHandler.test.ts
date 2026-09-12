import { describe, expect, it } from 'vitest';
import { DeleteFeatureHandler } from './deleteFeatureHandler.js';
import { DeleteFeatureCommand } from './deleteFeatureCommand.js';
import { FakeTransactionRunner } from '@shared/application/port/transactionRunnerDouble.js';
import type { IFeatureRepository } from '../../../domain/repository/iFeatureRepository.js';
import type { IFeatureTicketsGateway } from '../../../domain/port/iFeatureTicketsGateway.js';
import type { IUploadStorage } from '@shared/application/port/iUploadStorage.js';
import type { Feature } from '../../../domain/featureAggregate.js';

// Supprimer une feature écrit dans deux dépôts : ses tickets, puis elle-même. Ce qui se joue
// ici est la frontière transactionnelle — les deux écritures dedans, la libération des
// fichiers dehors — parce qu'une écriture qui en sortirait un jour survivrait à l'échec des
// autres, et personne ne le verrait avant de constater des tickets sans feature.

type Trace = string[];

function repository(trace: Trace, tx: FakeTransactionRunner, onDelete?: () => never): IFeatureRepository {
    return {
        findById: async () =>
            ({ getDocuments: () => [{ getUrl: () => '/uploads/feature.png' }] }) as unknown as Feature,
        findByOwner: async () => [],
        findByOwners: async () => [],
        lastNumberOf: async () => 0,
        save: async () => {},
        delete: async () => {
            trace.push(`delete:feature(tx=${tx.inTransaction})`);
            onDelete?.();
        },
    };
}

function tickets(trace: Trace, tx: FakeTransactionRunner): IFeatureTicketsGateway {
    return {
        countOf: async () => 2,
        deleteAllOf: async () => {
            trace.push(`delete:tickets(tx=${tx.inTransaction})`);
            return ['/uploads/ticket.png'];
        },
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

describe('DeleteFeatureHandler', () => {
    it('supprime les tickets puis la feature dans une seule transaction', async () => {
        const trace: Trace = [];
        const tx = new FakeTransactionRunner();
        const handler = new DeleteFeatureHandler(repository(trace, tx), tickets(trace, tx), uploads(trace, tx), tx);

        await handler.handle(new DeleteFeatureCommand('f1'));

        expect(trace).toEqual([
            'delete:tickets(tx=true)',
            'delete:feature(tx=true)',
            'release:/uploads/ticket.png,/uploads/feature.png(tx=false)',
        ]);
        expect(tx.started).toBe(1);
        expect(tx.committed).toBe(1);
    });

    it('abandonne la transaction si la suppression de la feature échoue', async () => {
        const trace: Trace = [];
        const tx = new FakeTransactionRunner();
        const boom = () => {
            throw new Error('feature delete failed');
        };
        const handler = new DeleteFeatureHandler(
            repository(trace, tx, boom),
            tickets(trace, tx),
            uploads(trace, tx),
            tx,
        );

        await expect(handler.handle(new DeleteFeatureCommand('f1'))).rejects.toThrow('feature delete failed');

        expect(tx.rolledBack).toBe(1);
        expect(tx.committed).toBe(0);
        // Les fichiers ne sont pas libérés : la suppression métier n'a pas eu lieu.
        expect(trace.some(line => line.startsWith('release:'))).toBe(false);
    });
});
