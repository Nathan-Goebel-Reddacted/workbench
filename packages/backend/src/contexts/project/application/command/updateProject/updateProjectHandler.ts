import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateProjectCommand } from './updateProjectCommand';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { Name } from '../../../domain/valueObject/name';
import { Description } from '../../../domain/valueObject/description';
import { Category } from '../../../domain/valueObject/category';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';

export class UpdateProjectHandler implements ICommandHandler<UpdateProjectCommand> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(command: UpdateProjectCommand): Promise<void> {
        const project = await this.repository.findById(command.id);
        if (!project) return;
        project.setName(new Name(command.name));
        project.setDescription(new Description(command.description));
        if (command.category != null) project.setCategory(parseEnum(command.category, Category, 'category'));
        await this.repository.save(project);
    }
}
