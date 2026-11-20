import { Command } from '@shared/application/command/command';

export class RegenerateLayoutCommand implements Command {
    static readonly commandName = 'contentEditor.RegenerateLayout';
    readonly commandName: string;

    constructor(
        readonly pageId: string,
        readonly screen: string,
    ) {
        this.commandName = RegenerateLayoutCommand.commandName;
    }
}
