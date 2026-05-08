import { Command } from "@shared/application/command/command";

type LinkInput = { url: string; displayText: string; logo: string };
type DocumentInput = { id: string; name: string; url: string; type: string };

export class CreateProjectCommand implements Command {
    static readonly commandName = "project.CreateProject";
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly description: string,
        readonly links: LinkInput[],
        readonly documents: DocumentInput[],
    ) {
        this.commandName = CreateProjectCommand.commandName;
    }
}
