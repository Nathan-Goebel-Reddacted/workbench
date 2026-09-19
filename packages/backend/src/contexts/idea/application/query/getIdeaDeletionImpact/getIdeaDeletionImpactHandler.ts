import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { GetIdeaDeletionImpactQuery } from './getIdeaDeletionImpactQuery';
import { IdeaDeletionImpactDto } from './ideaDeletionImpactDto';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { IIdeaFeaturesGateway } from '../../../domain/port/iIdeaFeaturesGateway';
import { IdeaId } from '../../../domain/valueObject/ideaId';

export class GetIdeaDeletionImpactHandler implements IQueryHandler<GetIdeaDeletionImpactQuery, IdeaDeletionImpactDto> {
    constructor(
        private readonly repository: IIdeaRepository,
        private readonly features: IIdeaFeaturesGateway,
    ) {}

    async handle(query: GetIdeaDeletionImpactQuery): Promise<IdeaDeletionImpactDto> {
        const idea = await this.repository.findById(new IdeaId(query.id));
        if (!idea) throw new NotFoundError('Idea', query.id);
        return this.features.countOf(query.id);
    }
}
