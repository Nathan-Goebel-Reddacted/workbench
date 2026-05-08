import { Feature } from "../featureAggregate";

export interface IFeatureRepository {
    findById(id: string): Promise<Feature | null>;
    findByProjectId(projectId: string): Promise<Feature[]>;
    existsById(id: string): Promise<boolean>;
    save(feature: Feature): Promise<void>;
}
