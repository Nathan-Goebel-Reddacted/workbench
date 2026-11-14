import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddElementCommand } from './addElementCommand';
import { PageMutator } from '../pageMutator';
import { ElementId } from '../../../domain/valueObject/elementId';

export class AddElementHandler implements ICommandHandler<AddElementCommand> {
    constructor(private readonly pages: PageMutator) {}

    async handle(command: AddElementCommand): Promise<void> {
        await this.pages.apply(command.pageId, page => {
            page.addElement(new ElementId(command.elementId), command.visibleTop ?? undefined);
            return [];
        });
    }
}
