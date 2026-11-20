import { Command } from '@shared/application/command/command';

export class RewriteMindmapCommand implements Command {
    static readonly commandName = 'shared.RewriteMindmap';
    readonly commandName = RewriteMindmapCommand.commandName;

    constructor(
        readonly filename: string,
        readonly content: unknown,
    ) {}
}
