import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { HideElementCommand } from './hideElementCommand';
import { PageMutator } from '../pageMutator';
import { ElementId } from '../../../domain/valueObject/elementId';
import { parseScreenSize } from '../../../domain/valueObject/screenSize';

export class HideElementHandler implements ICommandHandler<HideElementCommand> {
    constructor(private readonly pages: PageMutator) {}

    async handle(command: HideElementCommand): Promise<void> {
        const screen = parseScreenSize(command.screen);
        await this.pages.apply(command.pageId, page => {
            page.hideElement(new ElementId(command.elementId), screen, command.hidden);
            return [];
        });
    }
}
