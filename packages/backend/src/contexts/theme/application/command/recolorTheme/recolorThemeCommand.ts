import { Command } from '@shared/application/command/command';
import { ColorMap } from '../../../domain/valueObject/themeColors';

export class RecolorThemeCommand implements Command {
    static readonly commandName = 'theme.RecolorTheme';
    readonly commandName = RecolorThemeCommand.commandName;

    constructor(
        readonly id: string,
        readonly colors: ColorMap,
    ) {}
}
