import { Command } from "@shared/application/command/command";

export class RemoveFeatureDocumentCommand implements Command {
    static readonly commandName = "feature.RemoveFeatureDocument";
    readonly commandName: string;

    constructor(
        readonly featureId: string,
        readonly documentId: string,
    ) {
        this.commandName = RemoveFeatureDocumentCommand.commandName;
    }
}
