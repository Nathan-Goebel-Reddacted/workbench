import { Command } from "@shared/application/command/command";

export class RemoveAgentToolScopeCommand implements Command {
    static readonly commandName = "aiAssistant.RemoveAgentToolScope";
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly scope: string,
    ) {
        this.commandName = RemoveAgentToolScopeCommand.commandName;
    }
}
