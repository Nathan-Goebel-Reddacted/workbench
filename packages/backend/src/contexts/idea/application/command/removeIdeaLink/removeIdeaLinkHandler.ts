import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RemoveIdeaLinkCommand } from './removeIdeaLinkCommand';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { Link } from '../../../domain/valueObject/link';
import { NotFoundError } from '@shared/application/errors/notFoundError';

export class RemoveIdeaLinkHandler implements ICommandHandler<RemoveIdeaLinkCommand> {
    constructor(private readonly repository: IIdeaRepository) {}

    async handle(command: RemoveIdeaLinkCommand): Promise<void> {
        const idea = await this.repository.findById(command.ideaId);
        if (!idea) throw new NotFoundError('Idea', command.ideaId);
        idea.removeLink(new Link(command.url, command.displayText, command.logo));
        await this.repository.save(idea);
    }
}
