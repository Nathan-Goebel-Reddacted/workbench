import { Command } from '@shared/application/command/command';

export class UpdateProjectCommand implements Command {
    static readonly commandName = 'project.UpdateProject';
    readonly commandName = UpdateProjectCommand.commandName;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly description: string,
        readonly category?: string,
    ) {}
}
