import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListVisibleThemesQuery } from './listVisibleThemesQuery';
import { ThemeCatalogDto } from '../listThemes/themeCatalogDto';
import { toCatalogDto } from '../listThemes/themeCatalogMapper';
import { IThemeRepository } from '../../../domain/repository/iThemeRepository';

/**
 * Ce que voit le site public. Les thèmes masqués n'en sortent jamais — mais `defaultId` est
 * calculé sur la liste filtrée, et le thème par défaut est toujours visible par construction :
 * le visiteur reçoit donc toujours un défaut utilisable.
 */
export class ListVisibleThemesHandler implements IQueryHandler<ListVisibleThemesQuery, ThemeCatalogDto> {
    constructor(private readonly repository: IThemeRepository) {}

    async handle(): Promise<ThemeCatalogDto> {
        const visible = (await this.repository.findAll()).filter(theme => theme.isVisible());
        return toCatalogDto(visible);
    }
}
