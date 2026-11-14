import { Command } from '@shared/application/command/command';

export class SetComponentCommand implements Command {
    static readonly commandName = 'contentEditor.SetComponent';
    readonly commandName: string;

    constructor(
        readonly pageId: string,
        readonly elementId: string,
        readonly kind: string,
        readonly value: Record<string, unknown>,
    ) {
        this.commandName = SetComponentCommand.commandName;
    }
}
