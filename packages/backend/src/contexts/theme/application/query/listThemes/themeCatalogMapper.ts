import { Theme } from '../../../domain/themeAggregate';
import { ThemeCatalogDto } from './themeCatalogDto';

export function toCatalogDto(themes: Theme[]): ThemeCatalogDto {
    return {
        themes: themes.map(theme => ({
            id: theme.getId().getValue(),
            name: theme.getName().getValue(),
            visible: theme.isVisible(),
            colors: { ...theme.getColors().toRecord() },
        })),
        defaultId:
            themes
                .find(theme => theme.isDefault())
                ?.getId()
                .getValue() ?? null,
    };
}
