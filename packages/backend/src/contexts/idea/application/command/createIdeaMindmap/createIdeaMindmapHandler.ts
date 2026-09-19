import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { IMindmapStorage } from '@shared/application/port/iMindmapStorage';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { CreateIdeaMindmapCommand } from './createIdeaMindmapCommand';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { IdeaId } from '../../../domain/valueObject/ideaId';

export class CreateIdeaMindmapHandler implements ICommandHandler<CreateIdeaMindmapCommand, string> {
    constructor(
        private readonly repository: IIdeaRepository,
        private readonly mindmaps: IMindmapStorage,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: CreateIdeaMindmapCommand): Promise<string> {
        const idea = await this.repository.findById(new IdeaId(command.ideaId));
        if (!idea) throw new NotFoundError('Idea', command.ideaId);

        const url = await this.mindmaps.store(command.content);
        try {
            idea.addDocument(new Document(new DocumentId(command.documentId), command.name, url));
            await this.repository.save(idea);
        } catch (error) {
            await this.uploads.release([url]);
            throw error;
        }
        return url;
    }
}
