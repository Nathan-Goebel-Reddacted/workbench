import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { IOrphanUploadSweeper } from '@shared/application/port/iOrphanUploadSweeper';
import { PurgeOrphanUploadsCommand } from './purgeOrphanUploadsCommand';

export class PurgeOrphanUploadsHandler implements ICommandHandler<PurgeOrphanUploadsCommand, string[]> {
    constructor(private readonly sweeper: IOrphanUploadSweeper) {}

    handle(command: PurgeOrphanUploadsCommand): Promise<string[]> {
        return this.sweeper.purgeUnreferenced(command.olderThan);
    }
}
