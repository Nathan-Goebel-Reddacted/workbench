import { describe, expect, it } from 'vitest';
import { CreateFeatureHandler } from './createFeatureHandler.js';
import { CreateFeatureCommand } from './createFeatureCommand.js';
import { FeatureFactory } from '../../../domain/factory/featureFactory.js';
import { UnknownFeatureOwnerException } from '../../../domain/exception/unknownFeatureOwner.js';
import { DuplicateFeatureNumberException } from '../../../domain/exception/duplicateFeatureNumber.js';
import type { IFeatureRepository } from '../../../domain/repository/iFeatureRepository.js';
import type { IOwnerGateway } from '../../../domain/port/iOwnerGateway.js';
import type { Feature } from '../../../domain/featureAggregate.js';

// Deux règles vivent ici et nulle part ailleurs : une feature ne peut pas être créée sur un
// porteur qui n'existe pas, et son numéro est attribué à la lecture — donc deux créations
// simultanées chez le même porteur calculent le même, et la seconde doit retenter plutôt
// que d'échouer sous les yeux de l'utilisateur.

function command() {
    return new CreateFeatureCommand('f1', 'project', 'p1', 'Une feature', 'Sa description', []);
}

function ownerGateway(exists: boolean): IOwnerGateway {
    return { exists: async () => exists, numberOf: async () => (exists ? 4 : null) };
}

/**
 * Simule la contrainte d'unicité (porteur + numéro) : les `failures` premières écritures
 * sont refusées, comme si un autre appel avait pris le numéro entre-temps.
 */
function repository(options: { lastNumber: number; failures?: number }) {
    const saved: Feature[] = [];
    let remaining = options.failures ?? 0;

    const repo = {
        lastNumberOf: async () => options.lastNumber + saved.length,
        save: async (feature: Feature) => {
            if (remaining > 0) {
                remaining--;
                // Chaque échec fait avancer le numéro lu au tour suivant.
                options.lastNumber++;
                throw new DuplicateFeatureNumberException();
            }
            saved.push(feature);
        },
    } as unknown as IFeatureRepository;

    return { repo, saved };
}

describe('CreateFeatureHandler', () => {
    it('refuse de créer une feature sur un porteur qui n’existe pas', async () => {
        const { repo, saved } = repository({ lastNumber: 0 });
        const handler = new CreateFeatureHandler(repo, new FeatureFactory(), ownerGateway(false));

        await expect(handler.handle(command())).rejects.toThrow(UnknownFeatureOwnerException);

        expect(saved).toHaveLength(0);
    });

    it('attribue le numéro suivant chez ce porteur', async () => {
        const { repo, saved } = repository({ lastNumber: 7 });
        const handler = new CreateFeatureHandler(repo, new FeatureFactory(), ownerGateway(true));

        await handler.handle(command());

        expect(saved).toHaveLength(1);
        expect(saved[0].getNumber()).toBe(8);
    });

    it('repart à 1 chez un porteur qui n’a encore aucune feature', async () => {
        const { repo, saved } = repository({ lastNumber: 0 });
        const handler = new CreateFeatureHandler(repo, new FeatureFactory(), ownerGateway(true));

        await handler.handle(command());

        expect(saved[0].getNumber()).toBe(1);
    });

    it('retente quand un appel concurrent a pris le numéro', async () => {
        const { repo, saved } = repository({ lastNumber: 7, failures: 2 });
        const handler = new CreateFeatureHandler(repo, new FeatureFactory(), ownerGateway(true));

        await handler.handle(command());

        // Deux collisions, puis le numéro libre : l'utilisateur ne voit rien de tout cela.
        expect(saved).toHaveLength(1);
        expect(saved[0].getNumber()).toBe(10);
    });

    it('abandonne après cinq tentatives plutôt que de boucler', async () => {
        const { repo, saved } = repository({ lastNumber: 7, failures: 99 });
        const handler = new CreateFeatureHandler(repo, new FeatureFactory(), ownerGateway(true));

        await expect(handler.handle(command())).rejects.toThrow(DuplicateFeatureNumberException);

        expect(saved).toHaveLength(0);
    });
});
