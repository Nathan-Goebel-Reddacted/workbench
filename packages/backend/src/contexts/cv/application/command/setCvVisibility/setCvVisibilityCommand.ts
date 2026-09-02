import { Command } from '@shared/application/command/command';

export class SetCvVisibilityCommand implements Command {
    static readonly commandName = 'cv.SetCvVisibility';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly visible: boolean,
    ) {
        this.commandName = SetCvVisibilityCommand.commandName;
    }
}
