import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RemoveProjectDocumentCommand } from './removeProjectDocumentCommand';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { ProjectId } from '../../../domain/valueObject/projectId';

export class RemoveProjectDocumentHandler implements ICommandHandler<RemoveProjectDocumentCommand> {
    constructor(
        private readonly repository: IProjectRepository,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: RemoveProjectDocumentCommand): Promise<void> {
        const project = await this.repository.findById(new ProjectId(command.projectId));
        if (!project) throw new NotFoundError('Project', command.projectId);
        const removed = project.getDocuments().find(d => d.getId().getValue() === command.documentId);
        project.removeDocument(new DocumentId(command.documentId));
        await this.repository.save(project);
        // Après le save : tant que la ligne porte encore le document, il se compte lui-même.
        if (removed) await this.uploads.release([removed.getUrl()]);
    }
}
