import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetFeatureByIdQuery } from './getFeatureByIdQuery';
import { FeatureDto } from './featureDto';
import { IFeatureRepository } from '../../../domain/repository/iFeatureRepository';
import { IOwnerGateway } from '../../../domain/port/iOwnerGateway';
import { toFeatureDto } from '../featureDtoMapper';
import { FeatureId } from '../../../domain/valueObject/featureId';

export class GetFeatureByIdHandler implements IQueryHandler<GetFeatureByIdQuery, FeatureDto | null> {
    constructor(
        private readonly repository: IFeatureRepository,
        private readonly owners: IOwnerGateway,
    ) {}

    async handle(query: GetFeatureByIdQuery): Promise<FeatureDto | null> {
        const feature = await this.repository.findById(new FeatureId(query.id));
        if (!feature) return null;
        const ownerNumber = await this.owners.numberOf(feature.getOwner());
        return toFeatureDto(feature, ownerNumber);
    }
}
