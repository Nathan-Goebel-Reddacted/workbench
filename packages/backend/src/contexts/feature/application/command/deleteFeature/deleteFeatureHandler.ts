import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteFeatureCommand } from './deleteFeatureCommand';
import { IFeatureRepository } from '../../../domain/repository/iFeatureRepository';
import { IFeatureTicketsGateway } from '../../../domain/port/iFeatureTicketsGateway';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';

export class DeleteFeatureHandler implements ICommandHandler<DeleteFeatureCommand> {
    constructor(
        private readonly repository: IFeatureRepository,
        private readonly tickets: IFeatureTicketsGateway,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: DeleteFeatureCommand): Promise<void> {
        // Les tickets partent d'abord : un ticket sans feature n'est atteignable par aucun écran
        // et ne peut plus recevoir de référence valide.
        const feature = await this.repository.findById(command.id);
        const cascaded = await this.tickets.deleteAllOf(command.id);
        await this.repository.delete(command.id);
        await this.uploads.releaseFrom([...cascaded, ...(feature?.getDocuments().map(d => d.getUrl()) ?? [])]);
    }
}
