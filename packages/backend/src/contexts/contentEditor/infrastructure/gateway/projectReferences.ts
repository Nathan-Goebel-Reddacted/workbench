import { IProjectRepository } from '@contexts/project/domain/repository/iProjectRepository';
import { destinationOf } from '@contexts/project/application/query/projectDestination';
import { IProjectReferences, LinkDestination, ProjectSummary } from '../../domain/port/iProjectReferences';
import { IPageRepository } from '../../domain/repository/iPageRepository';
import { PageType } from '../../domain/valueObject/pageType';
import { PageRef } from '../../domain/valueObject/pageRef';

export class ProjectReferences implements IProjectReferences {
    constructor(
        private readonly projects: IProjectRepository,
        private readonly pages: IPageRepository,
    ) {}

    async summariesOf(projectIds: readonly string[]): Promise<ReadonlyMap<string, ProjectSummary>> {
        const ids = new Set(projectIds);
        if (ids.size === 0) return new Map();
        const [projects, pages] = await Promise.all([
            this.projects.findAll(),
            this.pages.findByRefs(
                PageType.PROJECT,
                [...ids].map(id => new PageRef(id)),
            ),
        ]);
        const withPage = new Set(pages.filter(p => p.hasContent()).map(p => p.getPageRef().getValue()));

        return new Map(
            projects
                .filter(project => ids.has(project.getId().getValue()))
                .map(project => {
                    const id = project.getId().getValue();
                    const found = destinationOf(project, withPage.has(id));
                    const destination: LinkDestination =
                        found.kind === 'page' ? { kind: 'page', projectId: id } : found;
                    return [id, { visible: project.isVisible(), destination }];
                }),
        );
    }
}
