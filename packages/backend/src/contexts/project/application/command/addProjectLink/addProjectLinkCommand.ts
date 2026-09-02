import { Command } from '@shared/application/command/command';

export class AddProjectLinkCommand implements Command {
    static readonly commandName = 'project.AddProjectLink';
    readonly commandName: string;

    constructor(
        readonly projectId: string,
        readonly url: string,
        readonly displayText: string,
        readonly logo: string,
    ) {
        this.commandName = AddProjectLinkCommand.commandName;
    }
}
