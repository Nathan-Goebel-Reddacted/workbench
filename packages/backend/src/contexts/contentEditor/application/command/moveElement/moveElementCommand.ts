import { Command } from '@shared/application/command/command';

export class MoveElementCommand implements Command {
    static readonly commandName = 'contentEditor.MoveElement';
    readonly commandName: string;

    constructor(
        readonly pageId: string,
        readonly elementId: string,
        readonly screen: string,
        readonly x: number,
        readonly y: number,
        readonly w: number,
        readonly h: number,
    ) {
        this.commandName = MoveElementCommand.commandName;
    }
}
