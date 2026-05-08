import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { CreateIdeaCommand } from "./createIdeaCommand";
import { IIdeaRepository } from "../../../domain/repository/iIdeaRepository";
import { IdeaFactory } from "../../../domain/factory/ideaFactory";

export class CreateIdeaHandler implements ICommandHandler<CreateIdeaCommand> {
    constructor(
        private readonly repository: IIdeaRepository,
        private readonly factory: IdeaFactory,
    ) {}

    async handle(command: CreateIdeaCommand): Promise<void> {
        const idea = this.factory.create(command.id, command.description, command.links, command.documents);
        await this.repository.save(idea);
    }
}
