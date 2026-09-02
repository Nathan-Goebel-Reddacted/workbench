import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { ReorderCvsCommand } from './reorderCvsCommand';
import { ICvRepository } from '../../../domain/repository/iCvRepository';

export class ReorderCvsHandler implements ICommandHandler<ReorderCvsCommand> {
    constructor(private readonly repository: ICvRepository) {}

    async handle(command: ReorderCvsCommand): Promise<void> {
        const cvs = await this.repository.findAll();

        const rank = new Map(command.orderedIds.map((id, index) => [id, index]));
        const ordered = [...cvs].sort((a, b) => {
            const rankA = rank.get(a.getId()) ?? Number.MAX_SAFE_INTEGER;
            const rankB = rank.get(b.getId()) ?? Number.MAX_SAFE_INTEGER;
            if (rankA !== rankB) return rankA - rankB;
            return a.getDisplayOrder() - b.getDisplayOrder();
        });

        ordered.forEach((cv, index) => cv.moveTo(index));
        await this.repository.saveAll(ordered);
    }
}
