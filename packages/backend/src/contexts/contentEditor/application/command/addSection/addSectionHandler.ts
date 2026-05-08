import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { AddSectionCommand } from "./addSectionCommand";
import { IPageLayoutRepository } from "../../../domain/repository/iPageLayoutRepository";
import { Section } from "../../../domain/entity/section";
import { SectionId } from "../../../domain/valueObject/sectionId";
import { SectionType } from "../../../domain/valueObject/sectionType";
import { ContentRef } from "../../../domain/valueObject/contentRef";
import { GridPosition } from "../../../domain/valueObject/gridPosition";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class AddSectionHandler implements ICommandHandler<AddSectionCommand> {
    constructor(private readonly repository: IPageLayoutRepository) {}

    async handle(command: AddSectionCommand): Promise<void> {
        const pageLayout = await this.repository.findById(command.pageLayoutId);
        if (!pageLayout) throw new NotFoundError("PageLayout", command.pageLayoutId);
        pageLayout.addSection(new Section(
            new SectionId(command.sectionId),
            command.type as SectionType,
            new ContentRef(command.contentRef),
            new GridPosition(command.column, command.order),
        ));
        await this.repository.save(pageLayout);
    }
}
