import { Command } from '@shared/application/command/command';

export class CreateProjectMindmapCommand implements Command {
    static readonly commandName = 'project.CreateProjectMindmap';
    readonly commandName: string;

    constructor(
        readonly projectId: string,
        readonly documentId: string,
        readonly name: string,
        readonly content: unknown,
    ) {
        this.commandName = CreateProjectMindmapCommand.commandName;
    }
}
