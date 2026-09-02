import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { CreateCvCommand } from './createCvCommand';
import { ICvRepository } from '../../../domain/repository/iCvRepository';
import { CvFactory } from '../../../domain/factory/cvFactory';

export class CreateCvHandler implements ICommandHandler<CreateCvCommand> {
    constructor(
        private readonly repository: ICvRepository,
        private readonly factory: CvFactory,
    ) {}

    async handle(command: CreateCvCommand): Promise<void> {
        const displayOrder = await this.repository.nextDisplayOrder();
        const cv = this.factory.create(command.id, command.name, command.fileUrl, displayOrder);
        await this.repository.save(cv);
    }
}
