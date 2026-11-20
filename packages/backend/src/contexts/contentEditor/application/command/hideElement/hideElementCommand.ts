import { Command } from '@shared/application/command/command';

export class HideElementCommand implements Command {
    static readonly commandName = 'contentEditor.HideElement';
    readonly commandName: string;

    constructor(
        readonly pageId: string,
        readonly elementId: string,
        readonly screen: string,
        readonly hidden: boolean,
    ) {
        this.commandName = HideElementCommand.commandName;
    }
}
