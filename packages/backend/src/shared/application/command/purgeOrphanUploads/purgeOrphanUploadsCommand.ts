import { Command } from '@shared/application/command/command';

export class PurgeOrphanUploadsCommand implements Command {
    static readonly commandName = 'shared.PurgeOrphanUploads';
    readonly commandName = PurgeOrphanUploadsCommand.commandName;

    constructor(readonly olderThan: Date) {}
}
