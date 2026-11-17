import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { ReorderElementCommand } from './reorderElementCommand';
import { PageMutator } from '../pageMutator';
import { ElementId } from '../../../domain/valueObject/elementId';

export class ReorderElementHandler implements ICommandHandler<ReorderElementCommand> {
    constructor(private readonly pages: PageMutator) {}

    async handle(command: ReorderElementCommand): Promise<void> {
        await this.pages.apply(command.pageId, page => {
            page.reorderElement(new ElementId(command.elementId), command.direction);
            return [];
        });
    }
}
