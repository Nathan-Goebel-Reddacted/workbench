import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { SetComponentCommand } from './setComponentCommand';
import { PageMutator } from '../pageMutator';
import { ElementId } from '../../../domain/valueObject/elementId';
import { SiteOrigins } from '../../../domain/valueObject/siteOrigins';

export class SetComponentHandler implements ICommandHandler<SetComponentCommand> {
    constructor(
        private readonly pages: PageMutator,
        private readonly siteOrigins: SiteOrigins,
    ) {}

    async handle(command: SetComponentCommand): Promise<void> {
        await this.pages.apply(command.pageId, page => {
            const previous = page.setComponent(
                new ElementId(command.elementId),
                command.kind,
                command.value,
                this.siteOrigins,
            );
            return previous ? [previous] : [];
        });
    }
}
