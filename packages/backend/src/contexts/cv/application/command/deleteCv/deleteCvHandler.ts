import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteCvCommand } from './deleteCvCommand';
import { ICvRepository } from '../../../domain/repository/iCvRepository';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { CvId } from '../../../domain/valueObject/cvId';

export class DeleteCvHandler implements ICommandHandler<DeleteCvCommand> {
    constructor(
        private readonly repository: ICvRepository,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: DeleteCvCommand): Promise<void> {
        const id = new CvId(command.id);
        const cv = await this.repository.findById(id);
        await this.repository.delete(id);
        if (cv) await this.uploads.release([cv.getFileUrl().getValue()]);
    }
}
