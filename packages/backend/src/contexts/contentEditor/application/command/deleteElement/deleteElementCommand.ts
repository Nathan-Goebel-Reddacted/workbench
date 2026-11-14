import { Command } from '@shared/application/command/command';

export class DeleteElementCommand implements Command {
    static readonly commandName = 'contentEditor.DeleteElement';
    readonly commandName: string;

    constructor(
        readonly pageId: string,
        readonly elementId: string,
    ) {
        this.commandName = DeleteElementCommand.commandName;
    }
}
