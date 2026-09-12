import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetProjectByIdQuery } from './getProjectByIdQuery';
import { ProjectDto } from './projectDto';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { Project } from '../../../domain/projectAggregate';
import { formatSegment } from '@shared/domain/valueObject/referenceSegment';

export class GetProjectByIdHandler implements IQueryHandler<GetProjectByIdQuery, ProjectDto | null> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(query: GetProjectByIdQuery): Promise<ProjectDto | null> {
        const project = await this.repository.findById(query.id);
        if (!project) return null;
        // Un projet caché est indiscernable d'un projet inexistant pour l'appelant anonyme.
        if (!query.includeHidden && !project.isVisible()) return null;
        return this.toDto(project);
    }

    private toDto(project: Project): ProjectDto {
        return {
            id: project.getId().getValue(),
            number: project.getNumber(),
            reference: formatSegment(project.getNumber()),
            name: project.getName().getValue(),
            description: project.getDescription().getValue(),
            visible: project.isVisible(),
            category: project.getCategory(),
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
