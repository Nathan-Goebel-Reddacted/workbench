import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateThemeCommand } from './updateThemeCommand';
import { IThemeRepository } from '../../../domain/repository/iThemeRepository';
import { ThemeId } from '../../../domain/valueObject/themeId';
import { ThemeName } from '../../../domain/valueObject/themeName';
import { ThemeColors } from '../../../domain/valueObject/themeColors';
import { NotFoundError } from '@shared/application/errors/notFoundError';

export class UpdateThemeHandler implements ICommandHandler<UpdateThemeCommand> {
    constructor(private readonly repository: IThemeRepository) {}

    async handle(command: UpdateThemeCommand): Promise<void> {
        const theme = await this.repository.findById(new ThemeId(command.id));
        if (!theme) throw new NotFoundError('Theme', command.id);

        theme.update(new ThemeName(command.name), new ThemeColors(command.colors), command.visible);
        await this.repository.save(theme);
    }
}
