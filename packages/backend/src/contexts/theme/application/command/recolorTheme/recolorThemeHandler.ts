import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { RecolorThemeCommand } from './recolorThemeCommand';
import { IThemeRepository } from '../../../domain/repository/iThemeRepository';
import { ThemeId } from '../../../domain/valueObject/themeId';
import { ThemeColors } from '../../../domain/valueObject/themeColors';

export class RecolorThemeHandler implements ICommandHandler<RecolorThemeCommand> {
    constructor(private readonly repository: IThemeRepository) {}

    async handle(command: RecolorThemeCommand): Promise<void> {
        const theme = await this.repository.findById(new ThemeId(command.id));
        if (!theme) throw new NotFoundError('Theme', command.id);

        theme.recolor(new ThemeColors(command.colors));
        await this.repository.save(theme);
    }
}
