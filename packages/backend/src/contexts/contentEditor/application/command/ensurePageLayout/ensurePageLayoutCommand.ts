import { Command } from '@shared/application/command/command';

export class EnsurePageLayoutCommand implements Command {
    static readonly commandName = 'contentEditor.EnsurePageLayout';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly pageType: string,
        readonly pageRef: string,
    ) {
        this.commandName = EnsurePageLayoutCommand.commandName;
    }
}
