import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { IFileStorage } from '@shared/application/port/iFileStorage';
import { storableExtension } from '@shared/domain/valueObject/uploadFilename';
import { StoreUploadCommand } from './storeUploadCommand';

export class StoreUploadHandler implements ICommandHandler<StoreUploadCommand, string> {
    constructor(private readonly files: IFileStorage) {}

    async handle(command: StoreUploadCommand): Promise<string> {
        return this.files.save(storableExtension(command.filename), command.content);
    }
}
