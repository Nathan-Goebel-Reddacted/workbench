import { Command } from '@shared/application/command/command';

type LinkInput = { url: string; displayText: string; logo: string };
type DocumentInput = { id: string; name: string; url: string; type: string };

export class CreateProjectCommand implements Command {
    static readonly commandName = 'project.CreateProject';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly description: string,
        readonly links: LinkInput[],
        readonly documents: DocumentInput[],
        readonly category?: string,
        /** Numéro imposé — utilisé par la conversion d'une idée, qui reprend le sien. Sinon alloué. */
        readonly number?: number,
        /** Un projet naît privé ; seule la conversion ou une création explicite peut en décider autrement. */
        readonly visible?: boolean,
    ) {
        this.commandName = CreateProjectCommand.commandName;
    }
}

export { Category } from '@contexts/project/domain/valueObject/category';
