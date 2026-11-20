import { Command } from '@shared/application/command/command';

export class DuplicateElementCommand implements Command {
    static readonly commandName = 'contentEditor.DuplicateElement';
    readonly commandName: string;

    constructor(
        readonly pageId: string,
        readonly sourceElementId: string,
        readonly elementId: string,
    ) {
        this.commandName = DuplicateElementCommand.commandName;
    }
}
