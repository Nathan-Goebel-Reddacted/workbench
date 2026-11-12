import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetPageLayoutByRefQuery } from './getPageLayoutByRefQuery';
import { PageLayoutDto } from '../getPageLayoutById/pageLayoutDto';
import { IPageLayoutRepository } from '../../../domain/repository/iPageLayoutRepository';
import { IPageVisibility } from '../../../domain/port/iPageVisibility';
import { PageType } from '../../../domain/valueObject/pageType';
import { PageRef } from '../../../domain/valueObject/pageRef';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';
import { toPageLayoutDto } from '../pageLayoutDtoMapper';

/**
 * Le layout suit la visibilité de la page qu'il habille : un projet masqué ne laisse pas
 * fuiter son contenu à qui en connaît l'identifiant, comme `GetProjectByIdHandler` le refuse
 * déjà pour le projet lui-même.
 */
export class GetPageLayoutByRefHandler implements IQueryHandler<GetPageLayoutByRefQuery, PageLayoutDto | null> {
    constructor(
        private readonly repository: IPageLayoutRepository,
        private readonly visibility: IPageVisibility,
    ) {}

    async handle(query: GetPageLayoutByRefQuery): Promise<PageLayoutDto | null> {
        const pageType = parseEnum(query.pageType, PageType, 'page type');
        const pageRef = new PageRef(query.pageRef);

        if (!query.includeHidden && !(await this.visibility.isPublic(pageType, pageRef))) return null;

        const pageLayout = await this.repository.findByRef(pageType, pageRef);
        return pageLayout ? toPageLayoutDto(pageLayout) : null;
    }
}
