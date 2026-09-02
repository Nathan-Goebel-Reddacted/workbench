import { Command } from '@shared/application/command/command';

export class AddIdeaDocumentCommand implements Command {
    static readonly commandName = 'idea.AddIdeaDocument';
    readonly commandName: string;

    constructor(
        readonly ideaId: string,
        readonly documentId: string,
        readonly name: string,
        readonly url: string,
        readonly type: string,
    ) {
        this.commandName = AddIdeaDocumentCommand.commandName;
    }
}
