import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RemoveIdeaDocumentCommand } from './removeIdeaDocumentCommand';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { IdeaId } from '../../../domain/valueObject/ideaId';

export class RemoveIdeaDocumentHandler implements ICommandHandler<RemoveIdeaDocumentCommand> {
    constructor(
        private readonly repository: IIdeaRepository,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: RemoveIdeaDocumentCommand): Promise<void> {
        const idea = await this.repository.findById(new IdeaId(command.ideaId));
        if (!idea) throw new NotFoundError('Idea', command.ideaId);
        const removed = idea.getDocuments().find(d => d.getId().getValue() === command.documentId);
        idea.removeDocument(new DocumentId(command.documentId));
        await this.repository.save(idea);
        // Après le save : tant que la ligne porte encore le document, il se compte lui-même.
        if (removed) await this.uploads.release([removed.getUrl()]);
    }
}
