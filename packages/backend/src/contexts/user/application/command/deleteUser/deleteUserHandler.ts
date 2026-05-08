import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { DeleteUserCommand } from "./deleteUserCommand";
import { IUserRepository } from "../../../domain/repository/iUserRepository";

export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
    constructor(private readonly repository: IUserRepository) {}

    async handle(command: DeleteUserCommand): Promise<void> {
        await this.repository.deleteById(command.userId);
    }
}
