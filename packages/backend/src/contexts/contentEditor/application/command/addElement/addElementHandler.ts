import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddElementCommand } from './addElementCommand';
import { PageMutator } from '../pageMutator';
import { ElementId } from '../../../domain/valueObject/elementId';
import { parseScreenSize } from '../../../domain/valueObject/screenSize';

export class AddElementHandler implements ICommandHandler<AddElementCommand> {
    constructor(private readonly pages: PageMutator) {}

    async handle(command: AddElementCommand): Promise<void> {
        const screen = parseScreenSize(command.screen);
        await this.pages.apply(command.pageId, page => {
            page.addElement(new ElementId(command.elementId), screen, command.visibleTop ?? undefined);
            return [];
        });
    }
}
