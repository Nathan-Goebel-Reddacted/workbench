import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { SetComponentCommand } from './setComponentCommand';
import { PageMutator } from '../pageMutator';
import { ElementId } from '../../../domain/valueObject/elementId';

export class SetComponentHandler implements ICommandHandler<SetComponentCommand> {
    constructor(private readonly pages: PageMutator) {}

    async handle(command: SetComponentCommand): Promise<void> {
        await this.pages.apply(command.pageId, page => {
            const previous = page.setComponent(new ElementId(command.elementId), command.kind, command.value);
            return previous ? [previous] : [];
        });
    }
}
