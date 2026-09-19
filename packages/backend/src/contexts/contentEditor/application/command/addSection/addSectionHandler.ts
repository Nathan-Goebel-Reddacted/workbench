import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddSectionCommand } from './addSectionCommand';
import { IPageLayoutRepository } from '../../../domain/repository/iPageLayoutRepository';
import { Section } from '../../../domain/entity/section';
import { SectionId } from '../../../domain/valueObject/sectionId';
import { SectionType } from '../../../domain/valueObject/sectionType';
import { GridPosition } from '../../../domain/valueObject/gridPosition';
import { SectionContent } from '../../../domain/valueObject/sectionContent/sectionContent';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';
import { PageLayoutId } from '../../../domain/valueObject/pageLayoutId';

export class AddSectionHandler implements ICommandHandler<AddSectionCommand> {
    constructor(private readonly repository: IPageLayoutRepository) {}

    async handle(command: AddSectionCommand): Promise<void> {
        const pageLayout = await this.repository.findById(new PageLayoutId(command.pageLayoutId));
        if (!pageLayout) throw new NotFoundError('PageLayout', command.pageLayoutId);
        const { placement } = command;
        const position = placement
            ? new GridPosition(placement.x, placement.y, placement.w, placement.h)
            : pageLayout.nextFreePosition();
        const type = parseEnum(command.type, SectionType, 'section type');
        pageLayout.addSection(
            new Section(
                new SectionId(command.sectionId),
                type,
                SectionContent.fromInput(type, command.content),
                position,
            ),
        );
        await this.repository.save(pageLayout);
    }
}
