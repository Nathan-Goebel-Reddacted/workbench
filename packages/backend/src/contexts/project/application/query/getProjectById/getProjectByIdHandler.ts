import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetProjectByIdQuery } from "./getProjectByIdQuery";
import { ProjectDto } from "./projectDto";
import { IProjectRepository } from "../../../domain/repository/iProjectRepository";
import { Project } from "../../../domain/projectAggregate";

export class GetProjectByIdHandler implements IQueryHandler<GetProjectByIdQuery, ProjectDto | null> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(query: GetProjectByIdQuery): Promise<ProjectDto | null> {
        const project = await this.repository.findById(query.id);
        if (!project) return null;
        return this.toDto(project);
    }

    private toDto(project: Project): ProjectDto {
        return {
            id: project.getId().getValue(),
            description: project.getDescription().getValue(),
            links: project.getLinks().map(l => ({
                url: l.getUrl(),
                displayText: l.getDisplayText(),
                logo: l.getLogo(),
            })),
            documents: project.getDocuments().map(d => ({
                id: d.getId().getValue(),
                name: d.getName(),
                url: d.getUrl(),
                type: d.getType(),
            })),
        };
    }
}
