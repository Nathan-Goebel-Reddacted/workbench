import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RemoveComponentCommand } from './removeComponentCommand';
import { PageMutator } from '../pageMutator';
import { ElementId } from '../../../domain/valueObject/elementId';

export class RemoveComponentHandler implements ICommandHandler<RemoveComponentCommand> {
    constructor(private readonly pages: PageMutator) {}

    async handle(command: RemoveComponentCommand): Promise<void> {
        await this.pages.apply(command.pageId, page => {
            const removed = page.removeComponent(new ElementId(command.elementId), command.kind);
            return removed ? [removed] : [];
        });
    }
}
