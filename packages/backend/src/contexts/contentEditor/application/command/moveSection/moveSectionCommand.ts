import { Command } from "@shared/application/command/command";

export class MoveSectionCommand implements Command {
    static readonly commandName = "contentEditor.MoveSection";
    readonly commandName: string;

    constructor(
        readonly pageLayoutId: string,
        readonly sectionId: string,
        readonly column: number,
        readonly order: number,
    ) {
        this.commandName = MoveSectionCommand.commandName;
    }
}
