import { Command } from '@shared/application/command/command';

export class ConvertIdeaToProjectCommand implements Command {
    static readonly commandName = 'idea.ConvertIdeaToProject';
    readonly commandName: string;

    constructor(
        readonly ideaId: string,
        /** Id du projet à créer — fourni par l'appelant, qui saura ainsi où rediriger. */
        readonly projectId: string,
        /** Catégorie du projet créé ; à défaut, celle de l'idée. */
        readonly category?: string,
    ) {
        this.commandName = ConvertIdeaToProjectCommand.commandName;
    }
}
