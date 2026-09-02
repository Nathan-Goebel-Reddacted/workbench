import { Command } from '@shared/application/command/command';

export class UpdateSectionContentCommand implements Command {
    static readonly commandName = 'contentEditor.UpdateSectionContent';
    readonly commandName: string;

    constructor(
        readonly pageLayoutId: string,
        readonly sectionId: string,
        readonly content: Record<string, unknown>,
        readonly contentRef: string | null,
    ) {
        this.commandName = UpdateSectionContentCommand.commandName;
    }
}
