import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetFeatureByIdQuery } from "./getFeatureByIdQuery";
import { FeatureDto } from "./featureDto";
import { IFeatureRepository } from "../../../domain/repository/iFeatureRepository";
import { Feature } from "../../../domain/featureAggregate";

export class GetFeatureByIdHandler implements IQueryHandler<GetFeatureByIdQuery, FeatureDto | null> {
    constructor(private readonly repository: IFeatureRepository) {}

    async handle(query: GetFeatureByIdQuery): Promise<FeatureDto | null> {
        const feature = await this.repository.findById(query.id);
        if (!feature) return null;
        return this.toDto(feature);
    }

    private toDto(feature: Feature): FeatureDto {
        return {
            id: feature.getId().getValue(),
            projectId: feature.getProjectId().getValue(),
            name: feature.getName().getValue(),
            description: feature.getDescription().getValue(),
            documents: feature.getDocuments().map(d => ({
                id: d.getId().getValue(),
                name: d.getName(),
                url: d.getUrl(),
                type: d.getType(),
            })),
        };
    }
}
