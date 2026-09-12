import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteIdeaCommand } from './deleteIdeaCommand';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { IIdeaFeaturesGateway } from '../../../domain/port/iIdeaFeaturesGateway';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { ITransactionRunner } from '@shared/application/port/iTransactionRunner';
import { IdeaId } from '../../../domain/valueObject/ideaId';

export class DeleteIdeaHandler implements ICommandHandler<DeleteIdeaCommand> {
    constructor(
        private readonly repository: IIdeaRepository,
        private readonly features: IIdeaFeaturesGateway,
        private readonly uploads: IUploadStorage,
        private readonly transaction: ITransactionRunner,
    ) {}

    async handle(command: DeleteIdeaCommand): Promise<void> {
        // Une feature et ses tickets n'ont pas de sens sans leur porteur : ils partent avec lui.
        // La conversion, elle, transfère les features avant de supprimer l'idée — elle ne passe
        // donc jamais par ce chemin (voir ConvertIdeaToProjectHandler).
        const idea = await this.repository.findById(new IdeaId(command.id));

        // C'est la cascade la plus profonde de l'application — idée, puis chacune de ses
        // features, puis les tickets de chacune. Elle écrit dans trois dépôts et autant de fois
        // qu'il y a de features : un incident en cours de route laisserait un porteur amputé
        // d'une partie de ses features, sans aucun moyen de savoir lesquelles.
        const cascaded = await this.transaction.run(async () => {
            const urls = await this.features.deleteAllOf(command.id);
            await this.repository.delete(new IdeaId(command.id));
            return urls;
        });

        await this.uploads.release([...cascaded, ...(idea?.getDocuments().map(d => d.getUrl()) ?? [])]);
    }
}
