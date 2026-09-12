import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddIdeaLinkCommand } from './addIdeaLinkCommand';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { Link } from '../../../domain/valueObject/link';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { IdeaId } from '../../../domain/valueObject/ideaId';

export class AddIdeaLinkHandler implements ICommandHandler<AddIdeaLinkCommand> {
    constructor(private readonly repository: IIdeaRepository) {}

    async handle(command: AddIdeaLinkCommand): Promise<void> {
        const idea = await this.repository.findById(new IdeaId(command.ideaId));
        if (!idea) throw new NotFoundError('Idea', command.ideaId);
        idea.addLink(new Link(command.url, command.displayText, command.logo));
        await this.repository.save(idea);
    }
}
