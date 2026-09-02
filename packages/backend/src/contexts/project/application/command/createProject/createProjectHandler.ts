import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { CreateProjectCommand } from './createProjectCommand';
import { IProjectRepository } from '../../../domain/repository/iProjectRepository';
import { ProjectFactory } from '../../../domain/factory/projectFactory';
import { Category } from '../../../domain/valueObject/category';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';
import { IOwnerNumberSequence } from '@shared/domain/port/iOwnerNumberSequence';

export class CreateProjectHandler implements ICommandHandler<CreateProjectCommand> {
    constructor(
        private readonly repository: IProjectRepository,
        private readonly factory: ProjectFactory,
        private readonly numbers: IOwnerNumberSequence,
    ) {}

    async handle(command: CreateProjectCommand): Promise<void> {
        const category =
            command.category != null ? parseEnum(command.category, Category, 'category') : Category.Personal;
        // Le numéro est alloué ici : la factory construit un objet, elle n'orchestre rien.
        const number = command.number ?? (await this.numbers.next());
        const project = this.factory.create(
            command.id,
            number,
            command.name,
            command.description,
            command.links,
            command.documents,
            command.visible ?? false,
            category,
        );
        await this.repository.save(project);
    }
}
