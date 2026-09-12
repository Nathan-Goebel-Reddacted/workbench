import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RemoveProjectLinkCommand } from './removeProjectLinkCommand';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { Link } from '../../../domain/valueObject/link';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { ProjectId } from '../../../domain/valueObject/projectId';

export class RemoveProjectLinkHandler implements ICommandHandler<RemoveProjectLinkCommand> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(command: RemoveProjectLinkCommand): Promise<void> {
        const project = await this.repository.findById(new ProjectId(command.projectId));
        if (!project) throw new NotFoundError('Project', command.projectId);
        project.removeLink(new Link(command.url, command.displayText, command.logo));
        await this.repository.save(project);
    }
}
