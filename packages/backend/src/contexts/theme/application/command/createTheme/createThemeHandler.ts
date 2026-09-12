import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { CreateThemeCommand } from './createThemeCommand';
import { IThemeRepository } from '../../../domain/repository/iThemeRepository';
import { ThemeFactory } from '../../../domain/factory/themeFactory';
import { ThemeDto } from '../../query/listThemes/themeCatalogDto';

/**
 * Rend le thème créé : le Design Lab l'ajoute à sa liste sans recharger tout le catalogue,
 * et c'est déjà ce que faisait l'ancienne route (201 + le thème).
 */
export class CreateThemeHandler implements ICommandHandler<CreateThemeCommand, ThemeDto> {
    constructor(
        private readonly repository: IThemeRepository,
        private readonly factory: ThemeFactory,
    ) {}

    async handle(command: CreateThemeCommand): Promise<ThemeDto> {
        const isFirstOne = await this.repository.isEmpty();
        const theme = this.factory.create(command.id, command.name, command.colors, command.visible, isFirstOne);
        await this.repository.save(theme);

        return {
            id: theme.getId().getValue(),
            name: theme.getName().getValue(),
            visible: theme.isVisible(),
            colors: { ...theme.getColors().toRecord() },
        };
    }
}
