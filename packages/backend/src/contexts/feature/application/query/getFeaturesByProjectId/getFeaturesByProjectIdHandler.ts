import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetFeaturesByProjectIdQuery } from "./getFeaturesByProjectIdQuery";
import { FeatureDto } from "../getFeatureById/featureDto";
import { IFeatureRepository } from "../../../domain/repository/iFeatureRepository";
import { Feature } from "../../../domain/featureAggregate";

export class GetFeaturesByProjectIdHandler implements IQueryHandler<GetFeaturesByProjectIdQuery, FeatureDto[]> {
    constructor(private readonly repository: IFeatureRepository) {}

    async handle(query: GetFeaturesByProjectIdQuery): Promise<FeatureDto[]> {
        const features = await this.repository.findByProjectId(query.projectId);
        return features.map(f => this.toDto(f));
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
