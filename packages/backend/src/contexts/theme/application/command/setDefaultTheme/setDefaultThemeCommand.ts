import { Command } from '@shared/application/command/command';

export class SetDefaultThemeCommand implements Command {
    static readonly commandName = 'theme.SetDefaultTheme';
    readonly commandName = SetDefaultThemeCommand.commandName;

    constructor(readonly id: string) {}
}
