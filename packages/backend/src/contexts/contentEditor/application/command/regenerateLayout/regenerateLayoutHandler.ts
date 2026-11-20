import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RegenerateLayoutCommand } from './regenerateLayoutCommand';
import { PageMutator } from '../pageMutator';
import { parseDerivedScreen } from '../../../domain/valueObject/screenSize';

export class RegenerateLayoutHandler implements ICommandHandler<RegenerateLayoutCommand> {
    constructor(private readonly pages: PageMutator) {}

    async handle(command: RegenerateLayoutCommand): Promise<void> {
        const screen = parseDerivedScreen(command.screen);
        await this.pages.apply(command.pageId, page => {
            page.regenerateLayout(screen);
            return [];
        });
    }
}
