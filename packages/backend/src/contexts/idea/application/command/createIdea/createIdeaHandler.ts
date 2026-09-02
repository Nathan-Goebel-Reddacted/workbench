import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { CreateIdeaCommand } from './createIdeaCommand';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { IdeaFactory } from '../../../domain/factory/ideaFactory';
import { Category } from '../../../domain/valueObject/category';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';
import { IOwnerNumberSequence } from '@shared/domain/port/iOwnerNumberSequence';

export class CreateIdeaHandler implements ICommandHandler<CreateIdeaCommand> {
    constructor(
        private readonly repository: IIdeaRepository,
        private readonly factory: IdeaFactory,
        private readonly numbers: IOwnerNumberSequence,
    ) {}

    async handle(command: CreateIdeaCommand): Promise<void> {
        const category =
            command.category != null ? parseEnum(command.category, Category, 'category') : Category.Personal;
        const number = await this.numbers.next();
        const idea = this.factory.create(
            command.id,
            number,
            command.name,
            command.description,
            command.links,
            command.documents,
            new Date(),
            category,
        );
        await this.repository.save(idea);
    }
}
