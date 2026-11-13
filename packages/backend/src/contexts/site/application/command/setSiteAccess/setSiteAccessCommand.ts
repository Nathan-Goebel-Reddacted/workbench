import { Command } from '@shared/application/command/command';

export class SetSiteAccessCommand implements Command {
    static readonly commandName = 'site.SetSiteAccess';
    readonly commandName: string;

    constructor(readonly open: boolean) {
        this.commandName = SetSiteAccessCommand.commandName;
    }
}
