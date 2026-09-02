import { Command } from '@shared/application/command/command';

export class ReorderCvsCommand implements Command {
    static readonly commandName = 'cv.ReorderCvs';
    readonly commandName: string;

    constructor(readonly orderedIds: string[]) {
        this.commandName = ReorderCvsCommand.commandName;
    }
}
