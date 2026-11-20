import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteElementCommand } from './deleteElementCommand';
import { PageMutator } from '../pageMutator';
import { ElementId } from '../../../domain/valueObject/elementId';

export class DeleteElementHandler implements ICommandHandler<DeleteElementCommand> {
    constructor(private readonly pages: PageMutator) {}

    async handle(command: DeleteElementCommand): Promise<void> {
        await this.pages.apply(command.pageId, page => [
            page.removeElement(new ElementId(command.elementId)).getComponents(),
        ]);
    }
}
