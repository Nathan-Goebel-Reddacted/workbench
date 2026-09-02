import { Command } from '@shared/application/command/command';

export class RemoveIdeaDocumentCommand implements Command {
    static readonly commandName = 'idea.RemoveIdeaDocument';
    readonly commandName: string;

    constructor(
        readonly ideaId: string,
        readonly documentId: string,
    ) {
        this.commandName = RemoveIdeaDocumentCommand.commandName;
    }
}
