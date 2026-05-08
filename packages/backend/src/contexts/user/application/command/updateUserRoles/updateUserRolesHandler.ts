import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { UpdateUserRolesCommand } from "./updateUserRolesCommand";
import { IUserRepository } from "../../../domain/repository/iUserRepository";
import { UserFactory } from "../../../domain/factory/userFactory";

export class UpdateUserRolesHandler implements ICommandHandler<UpdateUserRolesCommand> {
    constructor(
        private readonly repository: IUserRepository,
        private readonly factory: UserFactory,
    ) {}

    async handle(command: UpdateUserRolesCommand): Promise<void> {
        const existing = await this.repository.findById(command.userId);
        if (!existing) throw new Error(`User not found: ${command.userId}`);

        const updated = this.factory.create(
            existing.getId().getValue(),
            existing.getName().getValue(),
            existing.getSurname().getValue(),
            existing.getEmail().getValue(),
            command.roles,
        );
        await this.repository.save(updated);
    }
}
