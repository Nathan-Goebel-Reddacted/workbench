import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteIdeaCommand } from './deleteIdeaCommand';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { IIdeaFeaturesGateway } from '../../../domain/port/iIdeaFeaturesGateway';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';

export class DeleteIdeaHandler implements ICommandHandler<DeleteIdeaCommand> {
    constructor(
        private readonly repository: IIdeaRepository,
        private readonly features: IIdeaFeaturesGateway,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: DeleteIdeaCommand): Promise<void> {
        // Une feature et ses tickets n'ont pas de sens sans leur porteur : ils partent avec lui.
        // La conversion, elle, transfère les features avant de supprimer l'idée — elle ne passe
        // donc jamais par ce chemin (voir ConvertIdeaToProjectHandler).
        const idea = await this.repository.findById(command.id);
        const cascaded = await this.features.deleteAllOf(command.id);
        await this.repository.delete(command.id);
        await this.uploads.releaseFrom([...cascaded, ...(idea?.getDocuments().map(d => d.getUrl()) ?? [])]);
    }
}
