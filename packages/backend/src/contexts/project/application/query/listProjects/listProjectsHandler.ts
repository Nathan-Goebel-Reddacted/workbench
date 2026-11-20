import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListProjectsQuery } from './listProjectsQuery';
import { ProjectSummaryDto } from './projectSummaryDto';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { IProjectPageGateway } from '../../../domain/port/iProjectPageGateway';
import { destinationOf } from '../projectDestination';
import { Project } from '../../../domain/projectAggregate';
import { formatSegment } from '@shared/domain/valueObject/referenceSegment';

export class ListProjectsHandler implements IQueryHandler<ListProjectsQuery, ProjectSummaryDto[]> {
    constructor(
        private readonly repository: IProjectRepository,
        private readonly pages: IProjectPageGateway,
    ) {}

    async handle(query: ListProjectsQuery): Promise<ProjectSummaryDto[]> {
        const projects = await this.repository.findAll();
        const exposed = query.includeHidden ? projects : projects.filter(p => p.isVisible());
        const withPage = await this.pages.projectsWithPage(exposed.map(p => p.getId().getValue()));
        return exposed.map(p => this.toDto(p, withPage.has(p.getId().getValue())));
    }

    private toDto(project: Project, hasPage: boolean): ProjectSummaryDto {
        return {
            destination: destinationOf(project, hasPage),
            id: project.getId().getValue(),
            number: project.getNumber(),
            reference: formatSegment(project.getNumber()),
            name: project.getName().getValue(),
            description: project.getDescription().getValue(),
            visible: project.isVisible(),
            category: project.getCategory(),
        };
    }
}
