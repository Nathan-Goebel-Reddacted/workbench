import { describe, expect, it } from 'vitest';
import { GetIdeaDeletionImpactHandler } from './getIdeaDeletionImpactHandler.js';
import { GetIdeaDeletionImpactQuery } from './getIdeaDeletionImpactQuery.js';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import type { IIdeaRepository } from '../../../domain/repository/iIdeaRepository.js';
import type { IIdeaFeaturesGateway } from '../../../domain/port/iIdeaFeaturesGateway.js';
import type { Idea } from '../../../domain/ideaAggregate.js';

function repository(idea: Idea | null): IIdeaRepository {
    return {
        findById: async () => idea,
        findAll: async () => [],
        save: async () => {},
        delete: async () => {},
    };
}

const features: IIdeaFeaturesGateway = {
    countOf: async () => ({ features: 2, tickets: 5 }),
    deleteAllOf: async () => [],
    transferToProject: async () => {},
};

describe('GetIdeaDeletionImpactHandler', () => {
    it('annonce les features et les tickets que la suppression emporterait', async () => {
        const handler = new GetIdeaDeletionImpactHandler(repository({} as Idea), features);

        expect(await handler.handle(new GetIdeaDeletionImpactQuery('i1'))).toEqual({ features: 2, tickets: 5 });
    });

    it('refuse une idée inconnue', async () => {
        const handler = new GetIdeaDeletionImpactHandler(repository(null), features);

        await expect(handler.handle(new GetIdeaDeletionImpactQuery('i1'))).rejects.toThrow(NotFoundError);
    });
});
