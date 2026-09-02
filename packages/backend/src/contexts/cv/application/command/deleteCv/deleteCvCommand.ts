import { Command } from '@shared/application/command/command';

export class DeleteCvCommand implements Command {
    static readonly commandName = 'cv.DeleteCv';
    readonly commandName: string;

    constructor(readonly id: string) {
        this.commandName = DeleteCvCommand.commandName;
    }
}
