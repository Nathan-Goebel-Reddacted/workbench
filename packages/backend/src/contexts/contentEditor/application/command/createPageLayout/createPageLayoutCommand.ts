import { Command } from "@shared/application/command/command";

export class CreatePageLayoutCommand implements Command {
    static readonly commandName = "contentEditor.CreatePageLayout";
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly pageType: string,
        readonly pageRef: string,
    ) {
        this.commandName = CreatePageLayoutCommand.commandName;
    }
}
