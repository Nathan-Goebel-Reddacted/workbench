import { Command } from '@shared/application/command/command';

export class StoreUploadCommand implements Command {
    static readonly commandName = 'shared.StoreUpload';
    readonly commandName = StoreUploadCommand.commandName;

    constructor(
        readonly filename: string,
        readonly content: Buffer,
    ) {}
}
