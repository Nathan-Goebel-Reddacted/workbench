import { Command } from '@shared/application/command/command';

type LinkInput = { url: string; displayText: string; logo: string };
type DocumentInput = { id: string; name: string; url: string; type: string };

export class CreateIdeaCommand implements Command {
    static readonly commandName = 'idea.CreateIdea';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly description: string,
        readonly links: LinkInput[],
        readonly documents: DocumentInput[],
        readonly category?: string,
    ) {
        this.commandName = CreateIdeaCommand.commandName;
    }
}

export { Category } from '@contexts/idea/domain/valueObject/category';
