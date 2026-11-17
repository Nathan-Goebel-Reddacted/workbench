import { IProjectRepository } from '@contexts/project/domain/repository/iProjectRepository';
import { ProjectId } from '@contexts/project/domain/valueObject/projectId';
import { destinationOf } from '@contexts/project/application/query/projectDestination';
import { IProjectDestinations, LinkDestination } from '../../domain/port/iProjectDestinations';
import { IPageRepository } from '../../domain/repository/iPageRepository';
import { PageType } from '../../domain/valueObject/pageType';
import { PageRef } from '../../domain/valueObject/pageRef';

export class ProjectDestinations implements IProjectDestinations {
    constructor(
        private readonly projects: IProjectRepository,
        private readonly pages: IPageRepository,
    ) {}

    async destinationsOf(projectIds: readonly string[]): Promise<ReadonlyMap<string, LinkDestination>> {
        const ids = [...new Set(projectIds)];
        if (ids.length === 0) return new Map();
        const pages = await this.pages.findByRefs(
            PageType.PROJECT,
            ids.map(id => new PageRef(id)),
        );
        const withPage = new Set(pages.filter(p => p.hasContent()).map(p => p.getPageRef().getValue()));

        const entries = await Promise.all(
            ids.map(async (id): Promise<[string, LinkDestination]> => {
                const project = await this.projects.findById(new ProjectId(id));
                if (!project || !project.isVisible()) return [id, { kind: 'none' }];
                const destination = destinationOf(project, withPage.has(id));
                if (destination.kind === 'page') return [id, { kind: 'page', projectId: id }];
                return [id, destination];
            }),
        );
        return new Map(entries);
    }
}
