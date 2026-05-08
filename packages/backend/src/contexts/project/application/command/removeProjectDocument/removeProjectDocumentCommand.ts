import { Command } from "@shared/application/command/command";

export class RemoveProjectDocumentCommand implements Command {
    static readonly commandName = "project.RemoveProjectDocument";
    readonly commandName: string;

    constructor(
        readonly projectId: string,
        readonly documentId: string,
    ) {
        this.commandName = RemoveProjectDocumentCommand.commandName;
    }
}
