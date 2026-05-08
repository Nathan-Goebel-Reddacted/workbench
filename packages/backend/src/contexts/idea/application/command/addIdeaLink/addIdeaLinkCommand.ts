import { Command } from "@shared/application/command/command";

export class AddIdeaLinkCommand implements Command {
    static readonly commandName = "idea.AddIdeaLink";
    readonly commandName: string;

    constructor(
        readonly ideaId: string,
        readonly url: string,
        readonly displayText: string,
        readonly logo: string,
    ) {
        this.commandName = AddIdeaLinkCommand.commandName;
    }
}
