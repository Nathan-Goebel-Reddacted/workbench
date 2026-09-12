import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListThemesQuery } from './listThemesQuery';
import { ThemeCatalogDto } from './themeCatalogDto';
import { toCatalogDto } from './themeCatalogMapper';
import { IThemeRepository } from '../../../domain/repository/iThemeRepository';

export class ListThemesHandler implements IQueryHandler<ListThemesQuery, ThemeCatalogDto> {
    constructor(private readonly repository: IThemeRepository) {}

    async handle(): Promise<ThemeCatalogDto> {
        return toCatalogDto(await this.repository.findAll());
    }
}
