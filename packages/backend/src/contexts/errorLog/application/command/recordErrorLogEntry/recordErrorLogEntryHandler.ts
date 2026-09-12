import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RecordErrorLogEntryCommand } from './recordErrorLogEntryCommand';
import { IErrorLogRepository } from '../../../domain/repository/iErrorLogRepository';
import { ErrorLogEntryFactory } from '../../../domain/factory/errorLogEntryFactory';

export const DEFAULT_MAX_ROWS = 5000;
const TRIM_EVERY = 50;

/**
 * Unique chemin d'écriture dans le journal.
 *
 * Le plafond de lignes est une politique de rétention, pas une règle de l'entrée : il vit
 * donc ici et non dans l'agrégat. Il s'applique toutes les quelques écritures plutôt qu'à
 * chacune — la table reste bornée sans qu'une suppression accompagne chaque panne.
 */
export class RecordErrorLogEntryHandler implements ICommandHandler<RecordErrorLogEntryCommand> {
    private writesSinceTrim = 0;

    constructor(
        private readonly repository: IErrorLogRepository,
        private readonly factory: ErrorLogEntryFactory,
        private readonly maxRows: number = DEFAULT_MAX_ROWS,
    ) {}

    async handle(command: RecordErrorLogEntryCommand): Promise<void> {
        await this.repository.record(
            this.factory.record({
                origin: command.origin,
                message: command.message,
                ...command.details,
            }),
        );

        if (++this.writesSinceTrim >= TRIM_EVERY) {
            this.writesSinceTrim = 0;
            await this.repository.trim(this.maxRows);
        }
    }
}
