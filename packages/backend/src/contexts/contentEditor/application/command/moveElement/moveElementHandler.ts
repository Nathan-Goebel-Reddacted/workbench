import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { MoveElementCommand } from './moveElementCommand';
import { PageMutator } from '../pageMutator';
import { ElementId } from '../../../domain/valueObject/elementId';
import { Transform } from '../../../domain/valueObject/transform';

export class MoveElementHandler implements ICommandHandler<MoveElementCommand> {
    constructor(private readonly pages: PageMutator) {}

    async handle(command: MoveElementCommand): Promise<void> {
        const transform = new Transform(command.x, command.y, command.w, command.h);
        await this.pages.apply(command.pageId, page => {
            page.moveElement(new ElementId(command.elementId), transform);
            return [];
        });
    }
}
