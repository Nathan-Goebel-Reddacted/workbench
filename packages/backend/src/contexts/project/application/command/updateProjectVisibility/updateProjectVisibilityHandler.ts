import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateProjectVisibilityCommand } from './updateProjectVisibilityCommand';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { ProjectId } from '../../../domain/valueObject/projectId';

export class UpdateProjectVisibilityHandler implements ICommandHandler<UpdateProjectVisibilityCommand> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(command: UpdateProjectVisibilityCommand): Promise<void> {
        const project = await this.repository.findById(new ProjectId(command.id));
        if (!project) return;
        if (command.visible) project.publish();
        else project.hide();
        await this.repository.save(project);
    }
}
