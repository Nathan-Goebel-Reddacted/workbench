import { Command } from '@shared/application/command/command';
import { ReorderDirection } from '../../../domain/pageAggregate';

export class ReorderElementCommand implements Command {
    static readonly commandName = 'contentEditor.ReorderElement';
    readonly commandName: string;

    constructor(
        readonly pageId: string,
        readonly elementId: string,
        readonly direction: ReorderDirection,
    ) {
        this.commandName = ReorderElementCommand.commandName;
    }
}
