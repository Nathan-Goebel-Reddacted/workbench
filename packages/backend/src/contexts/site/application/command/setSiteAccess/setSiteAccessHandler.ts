import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { SetSiteAccessCommand } from './setSiteAccessCommand';
import { ISiteAccessRepository } from '../../../domain/repository/iSiteAccessRepository';

export class SetSiteAccessHandler implements ICommandHandler<SetSiteAccessCommand> {
    constructor(private readonly repository: ISiteAccessRepository) {}

    async handle(command: SetSiteAccessCommand): Promise<void> {
        const access = await this.repository.get();
        if (command.open) access.open();
        else access.close();
        await this.repository.save(access);
    }
}
