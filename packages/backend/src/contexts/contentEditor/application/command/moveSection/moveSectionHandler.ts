import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { MoveSectionCommand } from "./moveSectionCommand";
import { IPageLayoutRepository } from "../../../domain/repository/iPageLayoutRepository";
import { SectionId } from "../../../domain/valueObject/sectionId";
import { GridPosition } from "../../../domain/valueObject/gridPosition";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class MoveSectionHandler implements ICommandHandler<MoveSectionCommand> {
    constructor(private readonly repository: IPageLayoutRepository) {}

    async handle(command: MoveSectionCommand): Promise<void> {
        const pageLayout = await this.repository.findById(command.pageLayoutId);
        if (!pageLayout) throw new NotFoundError("PageLayout", command.pageLayoutId);
        pageLayout.moveSection(
            new SectionId(command.sectionId),
            new GridPosition(command.column, command.order),
        );
        await this.repository.save(pageLayout);
    }
}
