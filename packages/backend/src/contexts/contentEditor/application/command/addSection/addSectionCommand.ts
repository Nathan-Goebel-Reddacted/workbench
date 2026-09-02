import { Command } from '@shared/application/command/command';

export class AddSectionCommand implements Command {
    static readonly commandName = 'contentEditor.AddSection';
    readonly commandName: string;

    constructor(
        readonly pageLayoutId: string,
        readonly sectionId: string,
        readonly type: string,
        readonly contentRef: string | null,
        readonly content: Record<string, unknown>,
        readonly x: number,
        readonly y: number,
        readonly w: number,
        readonly h: number,
    ) {
        this.commandName = AddSectionCommand.commandName;
    }
}
