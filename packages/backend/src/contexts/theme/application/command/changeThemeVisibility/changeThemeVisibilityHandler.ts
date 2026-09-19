import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { ChangeThemeVisibilityCommand } from './changeThemeVisibilityCommand';
import { IThemeRepository } from '../../../domain/repository/iThemeRepository';
import { ThemeId } from '../../../domain/valueObject/themeId';

export class ChangeThemeVisibilityHandler implements ICommandHandler<ChangeThemeVisibilityCommand> {
    constructor(private readonly repository: IThemeRepository) {}

    async handle(command: ChangeThemeVisibilityCommand): Promise<void> {
        const theme = await this.repository.findById(new ThemeId(command.id));
        if (!theme) throw new NotFoundError('Theme', command.id);

        if (command.visible) theme.show();
        else theme.hide();
        await this.repository.save(theme);
    }
}
