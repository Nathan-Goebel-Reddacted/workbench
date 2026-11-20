import { QueryBus } from '@shared/application/query/queryBus';
import { IProjectPageGateway } from '../../domain/port/iProjectPageGateway';
import { ListPageRefsWithContentQuery } from '@contexts/contentEditor/application/query/listPageRefsWithContent/listPageRefsWithContentQuery';

export class ProjectPageGateway implements IProjectPageGateway {
    constructor(private readonly queryBus: QueryBus) {}

    async projectsWithPage(projectIds: readonly string[]): Promise<ReadonlySet<string>> {
        if (projectIds.length === 0) return new Set();
        const refs = await this.queryBus.dispatch<ListPageRefsWithContentQuery, string[]>(
            new ListPageRefsWithContentQuery('project', projectIds),
        );
        return new Set(refs);
    }
}
