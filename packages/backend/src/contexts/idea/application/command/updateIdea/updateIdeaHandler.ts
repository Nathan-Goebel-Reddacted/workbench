import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateIdeaCommand } from './updateIdeaCommand';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { Name } from '../../../domain/valueObject/name';
import { Description } from '../../../domain/valueObject/description';
import { Category } from '../../../domain/valueObject/category';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';

export class UpdateIdeaHandler implements ICommandHandler<UpdateIdeaCommand> {
    constructor(private readonly repository: IIdeaRepository) {}

    async handle(command: UpdateIdeaCommand): Promise<void> {
        const idea = await this.repository.findById(command.id);
        if (!idea) return;
        idea.setName(new Name(command.name));
        idea.setDescription(new Description(command.description));
        if (command.category != null) idea.setCategory(parseEnum(command.category, Category, 'category'));
        await this.repository.save(idea);
    }
}
