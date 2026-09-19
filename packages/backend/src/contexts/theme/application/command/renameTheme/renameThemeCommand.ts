import { Command } from '@shared/application/command/command';

export class RenameThemeCommand implements Command {
    static readonly commandName = 'theme.RenameTheme';
    readonly commandName = RenameThemeCommand.commandName;

    constructor(
        readonly id: string,
        readonly name: string,
    ) {}
}
