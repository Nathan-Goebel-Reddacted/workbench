import { describe, expect, it } from 'vitest';
import { GetFeatureByIdHandler } from './getFeatureByIdHandler.js';
import { GetFeatureByIdQuery } from './getFeatureByIdQuery.js';
import { FeatureFactory } from '../../../domain/factory/featureFactory.js';
import type { IFeatureRepository } from '../../../domain/repository/iFeatureRepository.js';
import type { IOwnerGateway } from '../../../domain/port/iOwnerGateway.js';
import type { Feature } from '../../../domain/featureAggregate.js';

function feature(): Feature {
    return new FeatureFactory().create('f1', 'project', 'p1', 8, 'Compétences', 'Cartographie', []);
}

function repository(found: Feature | null): IFeatureRepository {
    return { findById: async () => found } as unknown as IFeatureRepository;
}

function owners(publiclyVisible: boolean, number: number | null = 4): IOwnerGateway {
    return {
        exists: async () => number !== null,
        numberOf: async () => number,
        isPubliclyVisible: async () => publiclyVisible,
    };
}

describe('GetFeatureByIdHandler', () => {
    it('rend la feature à une session privée, même sous un porteur masqué', async () => {
        const handler = new GetFeatureByIdHandler(repository(feature()), owners(false));

        const result = await handler.handle(new GetFeatureByIdQuery('f1', true));

        expect(result?.name).toBe('Compétences');
    });

    it('masque la feature à un anonyme quand le porteur n’est pas publiquement visible', async () => {
        const handler = new GetFeatureByIdHandler(repository(feature()), owners(false));

        const result = await handler.handle(new GetFeatureByIdQuery('f1', false));

        expect(result).toBeNull();
    });

    it('rend la feature à un anonyme quand le porteur est visible', async () => {
        const handler = new GetFeatureByIdHandler(repository(feature()), owners(true));

        const result = await handler.handle(new GetFeatureByIdQuery('f1', false));

        expect(result?.reference).toBe('4.8');
    });

    it('inclut le porteur masqué par défaut, ce dont dépendent les appels internes', async () => {
        const handler = new GetFeatureByIdHandler(repository(feature()), owners(false));

        const result = await handler.handle(new GetFeatureByIdQuery('f1'));

        expect(result).not.toBeNull();
    });

    it('rend null quand la feature n’existe pas', async () => {
        const handler = new GetFeatureByIdHandler(repository(null), owners(true));

        const result = await handler.handle(new GetFeatureByIdQuery('f1', true));

        expect(result).toBeNull();
    });

    it('rend une référence vide quand le porteur a disparu', async () => {
        const handler = new GetFeatureByIdHandler(repository(feature()), owners(true, null));

        const result = await handler.handle(new GetFeatureByIdQuery('f1', true));

        expect(result?.reference).toBe('');
    });
});
