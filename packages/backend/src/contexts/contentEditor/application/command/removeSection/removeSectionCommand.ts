import { Command } from '@shared/application/command/command';

export class RemoveSectionCommand implements Command {
    static readonly commandName = 'contentEditor.RemoveSection';
    readonly commandName: string;

    constructor(
        readonly pageLayoutId: string,
        readonly sectionId: string,
    ) {
        this.commandName = RemoveSectionCommand.commandName;
    }
}
