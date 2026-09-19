import { Command } from '@shared/application/command/command';

export class CreateIdeaMindmapCommand implements Command {
    static readonly commandName = 'idea.CreateIdeaMindmap';
    readonly commandName: string;

    constructor(
        readonly ideaId: string,
        readonly documentId: string,
        readonly name: string,
        readonly content: unknown,
    ) {
        this.commandName = CreateIdeaMindmapCommand.commandName;
    }
}
