import { Command } from "@shared/application/command/command";

export class AddProjectDocumentCommand implements Command {
    static readonly commandName = "project.AddProjectDocument";
    readonly commandName: string;

    constructor(
        readonly projectId: string,
        readonly documentId: string,
        readonly name: string,
        readonly url: string,
        readonly type: string,
    ) {
        this.commandName = AddProjectDocumentCommand.commandName;
    }
}
