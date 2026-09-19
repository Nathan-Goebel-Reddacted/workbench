import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { GetFeatureDeletionImpactQuery } from './getFeatureDeletionImpactQuery';
import { FeatureDeletionImpactDto } from './featureDeletionImpactDto';
import { IFeatureRepository } from '../../../domain/repository/iFeatureRepository';
import { IFeatureTicketsGateway } from '../../../domain/port/iFeatureTicketsGateway';
import { FeatureId } from '../../../domain/valueObject/featureId';

export class GetFeatureDeletionImpactHandler
    implements IQueryHandler<GetFeatureDeletionImpactQuery, FeatureDeletionImpactDto>
{
    constructor(
        private readonly repository: IFeatureRepository,
        private readonly tickets: IFeatureTicketsGateway,
    ) {}

    async handle(query: GetFeatureDeletionImpactQuery): Promise<FeatureDeletionImpactDto> {
        const feature = await this.repository.findById(new FeatureId(query.id));
        if (!feature) throw new NotFoundError('Feature', query.id);
        return { tickets: await this.tickets.countOf(query.id) };
    }
}
