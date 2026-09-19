import { Command } from '@shared/application/command/command';

export type SectionPlacement = { x: number; y: number; w: number; h: number };

export class AddSectionCommand implements Command {
    static readonly commandName = 'contentEditor.AddSection';
    readonly commandName: string;

    constructor(
        readonly pageLayoutId: string,
        readonly sectionId: string,
        readonly type: string,
        readonly content: Record<string, unknown>,
        readonly placement: SectionPlacement | null,
    ) {
        this.commandName = AddSectionCommand.commandName;
    }
}
