import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RemoveFeatureDocumentCommand } from './removeFeatureDocumentCommand';
import { IFeatureRepository } from '../../../domain/repository/iFeatureRepository';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';

export class RemoveFeatureDocumentHandler implements ICommandHandler<RemoveFeatureDocumentCommand> {
    constructor(
        private readonly repository: IFeatureRepository,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: RemoveFeatureDocumentCommand): Promise<void> {
        const feature = await this.repository.findById(command.featureId);
        if (!feature) throw new NotFoundError('Feature', command.featureId);
        const removed = feature.getDocuments().find(d => d.getId().getValue() === command.documentId);
        feature.removeDocument(new DocumentId(command.documentId));
        await this.repository.save(feature);
        // Après le save : tant que la ligne porte encore le document, il se compte lui-même.
        if (removed) await this.uploads.releaseFrom(removed.getUrl());
    }
}
