import { Command } from '@shared/application/command/command';

export class DeleteIdeaCommand implements Command {
    static readonly commandName = 'idea.DeleteIdea';
    readonly commandName: string;

    constructor(readonly id: string) {
        this.commandName = DeleteIdeaCommand.commandName;
    }
}
