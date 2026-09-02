import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteCvCommand } from './deleteCvCommand';
import { ICvRepository } from '../../../domain/repository/iCvRepository';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';

export class DeleteCvHandler implements ICommandHandler<DeleteCvCommand> {
    constructor(
        private readonly repository: ICvRepository,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: DeleteCvCommand): Promise<void> {
        const cv = await this.repository.findById(command.id);
        await this.repository.delete(command.id);
        if (cv) await this.uploads.releaseFrom(cv.getFileUrl());
    }
}
