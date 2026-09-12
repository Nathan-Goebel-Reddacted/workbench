import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { PurgeErrorLogCommand } from './purgeErrorLogCommand';
import { IErrorLogRepository } from '../../../domain/repository/iErrorLogRepository';

/** Rend le nombre de lignes supprimées : c'est ce que l'écran d'administration affiche. */
export class PurgeErrorLogHandler implements ICommandHandler<PurgeErrorLogCommand, number> {
    constructor(private readonly repository: IErrorLogRepository) {}

    async handle(command: PurgeErrorLogCommand): Promise<number> {
        return this.repository.purge(command.before);
    }
}
