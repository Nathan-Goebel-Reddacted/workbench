import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateProjectCommand } from './updateProjectCommand';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { Name } from '../../../domain/valueObject/name';
import { Description } from '../../../domain/valueObject/description';
import { Category } from '../../../domain/valueObject/category';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';
import { ProjectId } from '../../../domain/valueObject/projectId';

export class UpdateProjectHandler implements ICommandHandler<UpdateProjectCommand> {
    constructor(private readonly repository: IProjectRepository) {}

    async handle(command: UpdateProjectCommand): Promise<void> {
        const project = await this.repository.findById(new ProjectId(command.id));
        if (!project) return;
        project.rename(new Name(command.name));
        project.describe(new Description(command.description));
        if (command.category != null) project.reclassify(parseEnum(command.category, Category, 'category'));
        await this.repository.save(project);
    }
}
