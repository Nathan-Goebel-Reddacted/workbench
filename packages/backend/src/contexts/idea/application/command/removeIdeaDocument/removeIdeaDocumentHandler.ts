import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { RemoveIdeaDocumentCommand } from "./removeIdeaDocumentCommand";
import { IIdeaRepository } from "../../../domain/repository/iIdeaRepository";
import { DocumentId } from "@shared/domain/valueObject/documentId";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class RemoveIdeaDocumentHandler implements ICommandHandler<RemoveIdeaDocumentCommand> {
    constructor(private readonly repository: IIdeaRepository) {}

    async handle(command: RemoveIdeaDocumentCommand): Promise<void> {
        const idea = await this.repository.findById(command.ideaId);
        if (!idea) throw new NotFoundError("Idea", command.ideaId);
        idea.removeDocument(new DocumentId(command.documentId));
        await this.repository.save(idea);
    }
}
