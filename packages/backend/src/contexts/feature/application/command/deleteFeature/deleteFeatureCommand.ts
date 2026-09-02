import { Command } from '@shared/application/command/command';

export class DeleteFeatureCommand implements Command {
    static readonly commandName = 'feature.DeleteFeature';
    readonly commandName = DeleteFeatureCommand.commandName;

    constructor(readonly id: string) {}
}
