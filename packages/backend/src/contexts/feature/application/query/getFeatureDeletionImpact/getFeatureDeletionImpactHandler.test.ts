import { describe, expect, it } from 'vitest';
import { GetFeatureDeletionImpactHandler } from './getFeatureDeletionImpactHandler.js';
import { GetFeatureDeletionImpactQuery } from './getFeatureDeletionImpactQuery.js';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import type { IFeatureRepository } from '../../../domain/repository/iFeatureRepository.js';
import type { IFeatureTicketsGateway } from '../../../domain/port/iFeatureTicketsGateway.js';
import type { Feature } from '../../../domain/featureAggregate.js';

function repository(feature: Feature | null): IFeatureRepository {
    return {
        findById: async () => feature,
        findByOwner: async () => [],
        findByOwners: async () => [],
        lastNumberOf: async () => 0,
        save: async () => {},
        delete: async () => {},
    };
}

const tickets: IFeatureTicketsGateway = {
    countOf: async () => 3,
    deleteAllOf: async () => [],
};

describe('GetFeatureDeletionImpactHandler', () => {
    it('annonce le nombre de tickets que la suppression emporterait', async () => {
        const handler = new GetFeatureDeletionImpactHandler(repository({} as Feature), tickets);

        expect(await handler.handle(new GetFeatureDeletionImpactQuery('f1'))).toEqual({ tickets: 3 });
    });

    it('refuse une feature inconnue', async () => {
        const handler = new GetFeatureDeletionImpactHandler(repository(null), tickets);

        await expect(handler.handle(new GetFeatureDeletionImpactQuery('f1'))).rejects.toThrow(NotFoundError);
    });
});
