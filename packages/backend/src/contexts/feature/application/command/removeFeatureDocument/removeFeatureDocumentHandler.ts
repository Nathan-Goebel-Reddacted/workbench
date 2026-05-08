import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { RemoveFeatureDocumentCommand } from "./removeFeatureDocumentCommand";
import { IFeatureRepository } from "../../../domain/repository/iFeatureRepository";
import { DocumentId } from "@shared/domain/valueObject/documentId";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class RemoveFeatureDocumentHandler implements ICommandHandler<RemoveFeatureDocumentCommand> {
    constructor(private readonly repository: IFeatureRepository) {}

    async handle(command: RemoveFeatureDocumentCommand): Promise<void> {
        const feature = await this.repository.findById(command.featureId);
        if (!feature) throw new NotFoundError("Feature", command.featureId);
        feature.removeDocument(new DocumentId(command.documentId));
        await this.repository.save(feature);
    }
}
