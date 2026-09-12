import { Command } from '@shared/application/command/command';
import { ColorMap } from '../../../domain/valueObject/themeColors';

export class CreateThemeCommand implements Command {
    static readonly commandName = 'theme.CreateTheme';
    readonly commandName = CreateThemeCommand.commandName;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly visible: boolean,
        readonly colors: ColorMap,
    ) {}
}
