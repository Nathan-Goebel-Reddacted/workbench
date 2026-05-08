import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { CreateFeatureCommand } from "./createFeatureCommand";
import { IFeatureRepository } from "../../../domain/repository/iFeatureRepository";
import { FeatureFactory } from "../../../domain/factory/featureFactory";

export class CreateFeatureHandler implements ICommandHandler<CreateFeatureCommand> {
    constructor(
        private readonly repository: IFeatureRepository,
        private readonly factory: FeatureFactory,
    ) {}

    async handle(command: CreateFeatureCommand): Promise<void> {
        const feature = this.factory.create(
            command.id,
            command.projectId,
            command.name,
            command.description,
            command.documents,
        );
        await this.repository.save(feature);
    }
}
