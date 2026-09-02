import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListIdeasQuery } from './listIdeasQuery';
import { IdeaSummaryDto } from './ideaSummaryDto';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { Idea } from '../../../domain/ideaAggregate';
import { formatSegment } from '@shared/domain/valueObject/referenceSegment';

export class ListIdeasHandler implements IQueryHandler<ListIdeasQuery, IdeaSummaryDto[]> {
    constructor(private readonly repository: IIdeaRepository) {}

    async handle(_query: ListIdeasQuery): Promise<IdeaSummaryDto[]> {
        const ideas = await this.repository.findAll();
        return ideas
            .sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime())
            .map(idea => this.toDto(idea));
    }

    private toDto(idea: Idea): IdeaSummaryDto {
        return {
            id: idea.getId().getValue(),
            number: idea.getNumber(),
            reference: formatSegment(idea.getNumber()),
            name: idea.getName().getValue(),
            description: idea.getDescription().getValue(),
            createdAt: idea.getCreatedAt().toISOString(),
            category: idea.getCategory(),
        };
    }
}
