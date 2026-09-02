import { Command } from '@shared/application/command/command';

export class CreateCvCommand implements Command {
    static readonly commandName = 'cv.CreateCv';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly fileUrl: string,
    ) {
        this.commandName = CreateCvCommand.commandName;
    }
}
