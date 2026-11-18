import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { IFileStorage } from '@shared/application/port/iFileStorage';
import { MINDMAP_SUFFIX } from '@shared/domain/valueObject/documentType';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { CreateProjectMindmapCommand } from './createProjectMindmapCommand';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { ProjectId } from '../../../domain/valueObject/projectId';

export class CreateProjectMindmapHandler implements ICommandHandler<CreateProjectMindmapCommand, string> {
    constructor(
        private readonly repository: IProjectRepository,
        private readonly files: IFileStorage,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: CreateProjectMindmapCommand): Promise<string> {
        const project = await this.repository.findById(new ProjectId(command.projectId));
        if (!project) throw new NotFoundError('Project', command.projectId);

        const url = await this.files.save(MINDMAP_SUFFIX, Buffer.from(JSON.stringify(command.content)));
        try {
            project.addDocument(new Document(new DocumentId(command.documentId), command.name, url));
            await this.repository.save(project);
        } catch (error) {
            await this.uploads.release([url]);
            throw error;
        }
        return url;
    }
}
