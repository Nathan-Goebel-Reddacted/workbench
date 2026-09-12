import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteFeatureCommand } from './deleteFeatureCommand';
import { IFeatureRepository } from '../../../domain/repository/iFeatureRepository';
import { IFeatureTicketsGateway } from '../../../domain/port/iFeatureTicketsGateway';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { ITransactionRunner } from '@shared/application/port/iTransactionRunner';

export class DeleteFeatureHandler implements ICommandHandler<DeleteFeatureCommand> {
    constructor(
        private readonly repository: IFeatureRepository,
        private readonly tickets: IFeatureTicketsGateway,
        private readonly uploads: IUploadStorage,
        private readonly transaction: ITransactionRunner,
    ) {}

    async handle(command: DeleteFeatureCommand): Promise<void> {
        const feature = await this.repository.findById(command.id);

        // Les tickets partent d'abord : un ticket sans feature n'est atteignable par aucun écran
        // et ne peut plus recevoir de référence valide. Les deux suppressions touchent deux
        // dépôts : sans transaction, un incident entre les deux perd les tickets et garde la
        // feature. Les dépôts ouvrent chacun la leur, qui devient un point de reprise de
        // celle-ci et tombe avec elle.
        const cascaded = await this.transaction.run(async () => {
            const urls = await this.tickets.deleteAllOf(command.id);
            await this.repository.delete(command.id);
            return urls;
        });

        // Hors transaction, et après elle : effacer un fichier ne s'annule pas, et un disque
        // en lecture seule ne doit pas faire échouer une suppression métier déjà acquise.
        await this.uploads.release([...cascaded, ...(feature?.getDocuments().map(d => d.getUrl()) ?? [])]);
    }
}
