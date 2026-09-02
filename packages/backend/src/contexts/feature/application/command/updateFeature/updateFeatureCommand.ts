import { Command } from '@shared/application/command/command';

export class UpdateFeatureCommand implements Command {
    static readonly commandName = 'feature.UpdateFeature';
    readonly commandName = UpdateFeatureCommand.commandName;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly description: string,
    ) {}
}
