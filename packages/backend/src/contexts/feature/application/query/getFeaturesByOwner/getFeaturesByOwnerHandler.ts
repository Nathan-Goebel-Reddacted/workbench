import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetFeaturesByOwnerQuery } from './getFeaturesByOwnerQuery';
import { FeatureDto } from '../getFeatureById/featureDto';
import { IFeatureRepository } from '../../../domain/repository/iFeatureRepository';
import { IOwnerGateway } from '../../../domain/port/iOwnerGateway';
import { FeatureOwner } from '../../../domain/valueObject/featureOwner';
import { toFeatureDto } from '../featureDtoMapper';

export class GetFeaturesByOwnerHandler implements IQueryHandler<GetFeaturesByOwnerQuery, FeatureDto[]> {
    constructor(
        private readonly repository: IFeatureRepository,
        private readonly owners: IOwnerGateway,
    ) {}

    async handle(query: GetFeaturesByOwnerQuery): Promise<FeatureDto[]> {
        const owner = new FeatureOwner(query.ownerType, query.ownerId);
        const features = await this.repository.findByOwner(owner);
        // Un seul aller-retour pour tout le lot : le numéro du porteur est le même pour toutes.
        const ownerNumber = await this.owners.numberOf(owner);
        return features.map(f => toFeatureDto(f, ownerNumber));
    }
}
