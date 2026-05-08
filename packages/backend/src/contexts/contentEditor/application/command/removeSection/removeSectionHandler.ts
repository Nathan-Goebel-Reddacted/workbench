import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { RemoveSectionCommand } from "./removeSectionCommand";
import { IPageLayoutRepository } from "../../../domain/repository/iPageLayoutRepository";
import { SectionId } from "../../../domain/valueObject/sectionId";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class RemoveSectionHandler implements ICommandHandler<RemoveSectionCommand> {
    constructor(private readonly repository: IPageLayoutRepository) {}

    async handle(command: RemoveSectionCommand): Promise<void> {
        const pageLayout = await this.repository.findById(command.pageLayoutId);
        if (!pageLayout) throw new NotFoundError("PageLayout", command.pageLayoutId);
        pageLayout.removeSection(new SectionId(command.sectionId));
        await this.repository.save(pageLayout);
    }
}
