import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListProjectsQuery } from './listProjectsQuery';
import { ProjectSummaryDto } from './projectSummaryDto';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { Project } from '../../../domain/projectAggregate';
import { formatSegment } from '@shared/domain/valueObject/referenceSegment';

export class ListProjectsHandler implements IQueryHandler<ListProjectsQuery, ProjectSummaryDto[]> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(query: ListProjectsQuery): Promise<ProjectSummaryDto[]> {
        const projects = await this.repository.findAll();
        const exposed = query.includeHidden ? projects : projects.filter(p => p.getVisible());
        return exposed.map(p => this.toDto(p));
    }

    private toDto(project: Project): ProjectSummaryDto {
        return {
            id: project.getId().getValue(),
            number: project.getNumber(),
            reference: formatSegment(project.getNumber()),
            name: project.getName().getValue(),
            description: project.getDescription().getValue(),
            visible: project.getVisible(),
            category: project.getCategory(),
        };
    }
}
