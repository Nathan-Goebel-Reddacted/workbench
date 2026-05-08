import { Command } from "@shared/application/command/command";

type DocumentInput = { id: string; name: string; url: string; type: string };

export class CreateFeatureCommand implements Command {
    static readonly commandName = "feature.CreateFeature";
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly projectId: string,
        readonly name: string,
        readonly description: string,
        readonly documents: DocumentInput[],
    ) {
        this.commandName = CreateFeatureCommand.commandName;
    }
}
