import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { RemoveProjectDocumentCommand } from "./removeProjectDocumentCommand";
import { IProjectRepository } from "../../../domain/repository/iProjectRepository";
import { DocumentId } from "@shared/domain/valueObject/documentId";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class RemoveProjectDocumentHandler implements ICommandHandler<RemoveProjectDocumentCommand> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(command: RemoveProjectDocumentCommand): Promise<void> {
        const project = await this.repository.findById(command.projectId);
        if (!project) throw new NotFoundError("Project", command.projectId);
        project.removeDocument(new DocumentId(command.documentId));
        await this.repository.save(project);
    }
}
