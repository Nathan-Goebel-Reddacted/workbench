import { Command } from '@shared/application/command/command';

export class ChangeThemeVisibilityCommand implements Command {
    static readonly commandName = 'theme.ChangeThemeVisibility';
    readonly commandName = ChangeThemeVisibilityCommand.commandName;

    constructor(
        readonly id: string,
        readonly visible: boolean,
    ) {}
}
