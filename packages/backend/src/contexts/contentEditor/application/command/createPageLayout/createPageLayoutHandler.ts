import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { CreatePageLayoutCommand } from "./createPageLayoutCommand";
import { IPageLayoutRepository } from "../../../domain/repository/iPageLayoutRepository";
import { PageLayoutFactory } from "../../../domain/factory/pageLayoutFactory";

export class CreatePageLayoutHandler implements ICommandHandler<CreatePageLayoutCommand> {
    constructor(
        private readonly repository: IPageLayoutRepository,
        private readonly factory: PageLayoutFactory,
    ) {}

    async handle(command: CreatePageLayoutCommand): Promise<void> {
        const pageLayout = this.factory.create(command.id, command.pageType, command.pageRef);
        await this.repository.save(pageLayout);
    }
}
