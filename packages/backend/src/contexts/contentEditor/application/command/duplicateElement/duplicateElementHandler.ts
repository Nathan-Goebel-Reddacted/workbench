import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DuplicateElementCommand } from './duplicateElementCommand';
import { PageMutator } from '../pageMutator';
import { ElementId } from '../../../domain/valueObject/elementId';

export class DuplicateElementHandler implements ICommandHandler<DuplicateElementCommand> {
    constructor(private readonly pages: PageMutator) {}

    async handle(command: DuplicateElementCommand): Promise<void> {
        await this.pages.apply(command.pageId, page => {
            page.duplicateElement(new ElementId(command.sourceElementId), new ElementId(command.elementId));
            return [];
        });
    }
}
