import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetIdeaByIdQuery } from "./getIdeaByIdQuery";
import { IdeaDto } from "./ideaDto";
import { IIdeaRepository } from "../../../domain/repository/iIdeaRepository";
import { Idea } from "../../../domain/ideaAggregate";

export class GetIdeaByIdHandler implements IQueryHandler<GetIdeaByIdQuery, IdeaDto | null> {
    constructor(private readonly repository: IIdeaRepository) {}

    async handle(query: GetIdeaByIdQuery): Promise<IdeaDto | null> {
        const idea = await this.repository.findById(query.id);
        if (!idea) return null;
        return this.toDto(idea);
    }

    private toDto(idea: Idea): IdeaDto {
        return {
            id: idea.getId().getValue(),
            description: idea.getDescription().getValue(),
            links: idea.getLinks().map(l => ({
                url: l.getUrl(),
                displayText: l.getDisplayText(),
                logo: l.getLogo(),
            })),
            documents: idea.getDocuments().map(d => ({
                id: d.getId().getValue(),
                name: d.getName(),
                url: d.getUrl(),
                type: d.getType(),
            })),
        };
    }
}
