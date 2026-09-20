import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { SetProjectPageReplacementCommand } from './setProjectPageReplacementCommand';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { ProjectId } from '../../../domain/valueObject/projectId';

export class SetProjectPageReplacementHandler implements ICommandHandler<SetProjectPageReplacementCommand> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(command: SetProjectPageReplacementCommand): Promise<void> {
        const project = await this.repository.findById(new ProjectId(command.projectId));
        if (!project) throw new NotFoundError('Project', command.projectId);

        if (command.url === null) project.keepOwnPage();
        else project.replacePageWith(command.url);

        await this.repository.save(project);
    }
}
