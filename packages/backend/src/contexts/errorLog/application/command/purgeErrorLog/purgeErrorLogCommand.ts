import { Command } from '@shared/application/command/command';

export class PurgeErrorLogCommand implements Command {
    static readonly commandName = 'errorLog.PurgeErrorLog';
    readonly commandName = PurgeErrorLogCommand.commandName;

    /** Sans `before`, le journal est vidé entièrement. */
    constructor(readonly before?: Date) {}
}
