import { Command } from '@shared/application/command/command';

export class UpdateProjectVisibilityCommand implements Command {
    static readonly commandName = 'project.UpdateProjectVisibility';
    readonly commandName = UpdateProjectVisibilityCommand.commandName;

    constructor(
        readonly id: string,
        readonly visible: boolean,
    ) {}
}
