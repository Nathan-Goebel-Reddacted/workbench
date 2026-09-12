import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddFeatureDocumentCommand } from './addFeatureDocumentCommand';
import { IFeatureRepository } from '../../../domain/repository/iFeatureRepository';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { DocumentType } from '@shared/domain/valueObject/documentType';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { FeatureId } from '../../../domain/valueObject/featureId';

export class AddFeatureDocumentHandler implements ICommandHandler<AddFeatureDocumentCommand> {
    constructor(private readonly repository: IFeatureRepository) {}

    async handle(command: AddFeatureDocumentCommand): Promise<void> {
        const feature = await this.repository.findById(new FeatureId(command.featureId));
        if (!feature) throw new NotFoundError('Feature', command.featureId);
        feature.addDocument(
            new Document(new DocumentId(command.documentId), command.name, command.url, command.type as DocumentType),
        );
        await this.repository.save(feature);
    }
}
