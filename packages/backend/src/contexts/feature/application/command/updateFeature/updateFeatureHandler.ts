import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateFeatureCommand } from './updateFeatureCommand';
import { IFeatureRepository } from '../../../domain/repository/iFeatureRepository';
import { Name } from '../../../domain/valueObject/name';
import { Description } from '../../../domain/valueObject/description';

export class UpdateFeatureHandler implements ICommandHandler<UpdateFeatureCommand> {
    constructor(private readonly repository: IFeatureRepository) {}

    async handle(command: UpdateFeatureCommand): Promise<void> {
        const feature = await this.repository.findById(command.id);
        if (!feature) return;
        feature.rename(new Name(command.name));
        feature.describe(new Description(command.description));
        await this.repository.save(feature);
    }
}
