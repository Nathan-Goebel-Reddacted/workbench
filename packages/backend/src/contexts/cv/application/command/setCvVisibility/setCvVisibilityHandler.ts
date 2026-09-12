import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { SetCvVisibilityCommand } from './setCvVisibilityCommand';
import { ICvRepository } from '../../../domain/repository/iCvRepository';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { CvId } from '../../../domain/valueObject/cvId';

export class SetCvVisibilityHandler implements ICommandHandler<SetCvVisibilityCommand> {
    constructor(private readonly repository: ICvRepository) {}

    async handle(command: SetCvVisibilityCommand): Promise<void> {
        const cv = await this.repository.findById(new CvId(command.id));
        if (!cv) throw new NotFoundError('Cv', command.id);
        cv.setVisible(command.visible);
        await this.repository.save(cv);
    }
}
