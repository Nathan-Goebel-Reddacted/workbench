import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { AddIdeaDocumentCommand } from "./addIdeaDocumentCommand";
import { IIdeaRepository } from "../../../domain/repository/iIdeaRepository";
import { Document } from "@shared/domain/entity/document";
import { DocumentId } from "@shared/domain/valueObject/documentId";
import { DocumentType } from "@shared/domain/valueObject/documentType";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class AddIdeaDocumentHandler implements ICommandHandler<AddIdeaDocumentCommand> {
    constructor(private readonly repository: IIdeaRepository) {}

    async handle(command: AddIdeaDocumentCommand): Promise<void> {
        const idea = await this.repository.findById(command.ideaId);
        if (!idea) throw new NotFoundError("Idea", command.ideaId);
        idea.addDocument(new Document(
            new DocumentId(command.documentId),
            command.name,
            command.url,
            command.type as DocumentType,
        ));
        await this.repository.save(idea);
    }
}
