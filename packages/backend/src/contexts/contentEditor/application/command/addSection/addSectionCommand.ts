import { Command } from "@shared/application/command/command";

export class AddSectionCommand implements Command {
    static readonly commandName = "contentEditor.AddSection";
    readonly commandName: string;

    constructor(
        readonly pageLayoutId: string,
        readonly sectionId: string,
        readonly type: string,
        readonly contentRef: string,
        readonly column: number,
        readonly order: number,
    ) {
        this.commandName = AddSectionCommand.commandName;
    }
}
