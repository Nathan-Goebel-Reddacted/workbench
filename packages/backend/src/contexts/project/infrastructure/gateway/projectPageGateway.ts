import { QueryBus } from '@shared/application/query/queryBus';
import { IProjectPageGateway } from '../../domain/port/iProjectPageGateway';
import { GetPageLayoutByRefQuery } from '@contexts/contentEditor/application/query/getPageLayoutByRef/getPageLayoutByRefQuery';
import { PageLayoutDto } from '@contexts/contentEditor/application/query/getPageLayoutById/pageLayoutDto';

export class ProjectPageGateway implements IProjectPageGateway {
    constructor(private readonly queryBus: QueryBus) {}

    async hasSections(projectId: string): Promise<boolean> {
        const layout = (await this.queryBus.dispatch(
            new GetPageLayoutByRefQuery('project', projectId, true),
        )) as PageLayoutDto | null;

        return layout !== null && layout.sections.length > 0;
    }
}
