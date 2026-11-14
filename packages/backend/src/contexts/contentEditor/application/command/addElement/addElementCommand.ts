import { Command } from '@shared/application/command/command';

export class AddElementCommand implements Command {
    static readonly commandName = 'contentEditor.AddElement';
    readonly commandName: string;

    constructor(
        readonly pageId: string,
        readonly elementId: string,
        readonly visibleTop: number | null,
    ) {
        this.commandName = AddElementCommand.commandName;
    }
}
