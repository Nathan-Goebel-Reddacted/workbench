import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { RenameThemeCommand } from './renameThemeCommand';
import { IThemeRepository } from '../../../domain/repository/iThemeRepository';
import { ThemeId } from '../../../domain/valueObject/themeId';
import { ThemeName } from '../../../domain/valueObject/themeName';

export class RenameThemeHandler implements ICommandHandler<RenameThemeCommand> {
    constructor(private readonly repository: IThemeRepository) {}

    async handle(command: RenameThemeCommand): Promise<void> {
        const theme = await this.repository.findById(new ThemeId(command.id));
        if (!theme) throw new NotFoundError('Theme', command.id);

        theme.rename(new ThemeName(command.name));
        await this.repository.save(theme);
    }
}
