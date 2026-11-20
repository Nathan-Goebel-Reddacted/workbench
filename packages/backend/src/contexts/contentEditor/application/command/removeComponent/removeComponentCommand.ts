import { Command } from '@shared/application/command/command';

export class RemoveComponentCommand implements Command {
    static readonly commandName = 'contentEditor.RemoveComponent';
    readonly commandName: string;

    constructor(
        readonly pageId: string,
        readonly elementId: string,
        readonly kind: string,
    ) {
        this.commandName = RemoveComponentCommand.commandName;
    }
}
