import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { CreateProjectCommand } from "./createProjectCommand";
import { IProjectRepository } from "../../../domain/repository/iProjectRepository";
import { ProjectFactory } from "../../../domain/factory/projectFactory";

export class CreateProjectHandler implements ICommandHandler<CreateProjectCommand> {
    constructor(
        private readonly repository: IProjectRepository,
        private readonly factory: ProjectFactory,
    ) {}

    async handle(command: CreateProjectCommand): Promise<void> {
        const project = this.factory.create(command.id, command.description, command.links, command.documents);
        await this.repository.save(project);
    }
}
