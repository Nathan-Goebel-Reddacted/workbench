import { Command } from '@shared/application/command/command';

export class RemoveIdeaLinkCommand implements Command {
    static readonly commandName = 'idea.RemoveIdeaLink';
    readonly commandName: string;

    constructor(
        readonly ideaId: string,
        readonly url: string,
        readonly displayText: string,
        readonly logo: string,
    ) {
        this.commandName = RemoveIdeaLinkCommand.commandName;
    }
}
