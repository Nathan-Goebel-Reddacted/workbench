import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { CreateTicketCommand } from "./createTicketCommand";
import { ITicketRepository } from "../../../domain/repository/iTicketRepository";
import { TicketFactory } from "../../../domain/factory/ticketFactory";
import { TicketReference } from "../../../domain/valueObject/reference";

export class CreateTicketHandler implements ICommandHandler<CreateTicketCommand> {
    constructor(
        private readonly repository: ITicketRepository,
        private readonly factory: TicketFactory,
    ) {}

    async handle(command: CreateTicketCommand): Promise<void> {
        const position = await this.repository.countByFeatureId(command.featureId);
        const reference = TicketReference.create(command.featureRef, position + 1);
        const ticket = this.factory.create(
            command.id,
            command.featureId,
            reference,
            command.title,
            command.description,
        );
        await this.repository.save(ticket);
    }
}
