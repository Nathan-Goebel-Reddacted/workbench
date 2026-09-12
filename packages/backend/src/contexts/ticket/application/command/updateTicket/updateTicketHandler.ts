import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateTicketCommand } from './updateTicketCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { Title } from '../../../domain/valueObject/title';
import { Description } from '../../../domain/valueObject/description';

export class UpdateTicketHandler implements ICommandHandler<UpdateTicketCommand> {
    constructor(private readonly repository: ITicketRepository) {}

    async handle(command: UpdateTicketCommand): Promise<void> {
        const ticket = await this.repository.findById(command.id);
        if (!ticket) return;
        ticket.retitle(new Title(command.title));
        ticket.describe(new Description(command.description));
        await this.repository.save(ticket);
    }
}
