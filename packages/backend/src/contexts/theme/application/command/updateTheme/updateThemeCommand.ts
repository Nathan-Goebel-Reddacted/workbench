import { Command } from '@shared/application/command/command';
import { ColorMap } from '../../../domain/valueObject/themeColors';

export class UpdateThemeCommand implements Command {
    static readonly commandName = 'theme.UpdateTheme';
    readonly commandName = UpdateThemeCommand.commandName;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly visible: boolean,
        readonly colors: ColorMap,
    ) {}
}
