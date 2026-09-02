import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddProjectLinkCommand } from './addProjectLinkCommand';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { Link } from '../../../domain/valueObject/link';
import { NotFoundError } from '@shared/application/errors/notFoundError';

export class AddProjectLinkHandler implements ICommandHandler<AddProjectLinkCommand> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(command: AddProjectLinkCommand): Promise<void> {
        const project = await this.repository.findById(command.projectId);
        if (!project) throw new NotFoundError('Project', command.projectId);
        project.addLink(new Link(command.url, command.displayText, command.logo));
        await this.repository.save(project);
    }
}
