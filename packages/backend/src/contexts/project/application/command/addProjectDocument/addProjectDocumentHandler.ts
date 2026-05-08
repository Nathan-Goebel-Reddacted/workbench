import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { AddProjectDocumentCommand } from "./addProjectDocumentCommand";
import { IProjectRepository } from "../../../domain/repository/iProjectRepository";
import { Document } from "@shared/domain/entity/document";
import { DocumentId } from "@shared/domain/valueObject/documentId";
import { DocumentType } from "@shared/domain/valueObject/documentType";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class AddProjectDocumentHandler implements ICommandHandler<AddProjectDocumentCommand> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(command: AddProjectDocumentCommand): Promise<void> {
        const project = await this.repository.findById(command.projectId);
        if (!project) throw new NotFoundError("Project", command.projectId);
        project.addDocument(new Document(
            new DocumentId(command.documentId),
            command.name,
            command.url,
            command.type as DocumentType,
        ));
        await this.repository.save(project);
    }
}
