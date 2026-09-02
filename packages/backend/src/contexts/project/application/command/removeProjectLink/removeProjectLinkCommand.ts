import { Command } from '@shared/application/command/command';

export class RemoveProjectLinkCommand implements Command {
    static readonly commandName = 'project.RemoveProjectLink';
    readonly commandName: string;

    constructor(
        readonly projectId: string,
        readonly url: string,
        readonly displayText: string,
        readonly logo: string,
    ) {
        this.commandName = RemoveProjectLinkCommand.commandName;
    }
}
