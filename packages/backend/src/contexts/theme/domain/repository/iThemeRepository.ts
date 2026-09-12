import { Theme } from '../themeAggregate';
import { ThemeId } from '../valueObject/themeId';

export interface IThemeRepository {
    findById(id: ThemeId): Promise<Theme | null>;
    /** Tous les thèmes, dans l'ordre de leur création — c'est celui du Design Lab. */
    findAll(): Promise<Theme[]>;
    isEmpty(): Promise<boolean>;
    save(theme: Theme): Promise<void>;
}
