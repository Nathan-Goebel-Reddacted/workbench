import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateProjectVisibilityCommand } from './updateProjectVisibilityCommand';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';

export class UpdateProjectVisibilityHandler implements ICommandHandler<UpdateProjectVisibilityCommand> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(command: UpdateProjectVisibilityCommand): Promise<void> {
        const project = await this.repository.findById(command.id);
        if (!project) return;
        project.setVisible(command.visible);
        await this.repository.save(project);
    }
}
