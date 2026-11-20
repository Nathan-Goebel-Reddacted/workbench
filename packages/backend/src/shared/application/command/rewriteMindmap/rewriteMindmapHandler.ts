import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { IFileStorage } from '@shared/application/port/iFileStorage';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { assertStoredMindmapName } from '@shared/domain/valueObject/uploadFilename';
import { RewriteMindmapCommand } from './rewriteMindmapCommand';

export class RewriteMindmapHandler implements ICommandHandler<RewriteMindmapCommand, string> {
    constructor(private readonly files: IFileStorage) {}

    async handle(command: RewriteMindmapCommand): Promise<string> {
        assertStoredMindmapName(command.filename);
        const rewritten = await this.files.rewrite(command.filename, JSON.stringify(command.content));
        if (!rewritten) throw new NotFoundError('File', command.filename);
        return `/uploads/${command.filename}`;
    }
}
