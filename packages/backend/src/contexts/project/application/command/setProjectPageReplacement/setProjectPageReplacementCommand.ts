import { Command } from '@shared/application/command/command';

export class SetProjectPageReplacementCommand implements Command {
    static readonly commandName = 'project.SetProjectPageReplacement';
    readonly commandName: string;

    constructor(
        readonly projectId: string,
        readonly url: string | null,
    ) {
        this.commandName = SetProjectPageReplacementCommand.commandName;
    }
}
