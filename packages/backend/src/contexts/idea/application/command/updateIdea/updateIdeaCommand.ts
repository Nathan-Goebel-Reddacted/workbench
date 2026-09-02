import { Command } from '@shared/application/command/command';

export class UpdateIdeaCommand implements Command {
    static readonly commandName = 'idea.UpdateIdea';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly description: string,
        readonly category?: string,
    ) {
        this.commandName = UpdateIdeaCommand.commandName;
    }
}
