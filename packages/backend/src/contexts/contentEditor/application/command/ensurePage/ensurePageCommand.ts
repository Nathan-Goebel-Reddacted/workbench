import { Command } from '@shared/application/command/command';

export class EnsurePageCommand implements Command {
    static readonly commandName = 'contentEditor.EnsurePage';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly pageType: string,
        readonly pageRef: string,
    ) {
        this.commandName = EnsurePageCommand.commandName;
    }
}
