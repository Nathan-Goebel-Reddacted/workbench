import { IIdeaFeaturesGateway } from '../../domain/port/iIdeaFeaturesGateway';
import { IFeatureRepository } from '@contexts/feature/domain/repository/iFeatureRepository';
import { IFeatureTicketsGateway } from '@contexts/feature/domain/port/iFeatureTicketsGateway';
import { FeatureOwner } from '@contexts/feature/domain/valueObject/featureOwner';

/** Adaptateur vers le contexte Feature, seul à savoir ce qu'une idée porte. */
export class IdeaFeaturesGateway implements IIdeaFeaturesGateway {
    constructor(
        private readonly features: IFeatureRepository,
        private readonly tickets: IFeatureTicketsGateway,
    ) {}

    async countOf(ideaId: string): Promise<{ features: number; tickets: number }> {
        const features = await this.features.findByOwner(FeatureOwner.idea(ideaId));
        const counts = await Promise.all(features.map(f => this.tickets.countOf(f.getId().getValue())));
        return { features: features.length, tickets: counts.reduce((sum, n) => sum + n, 0) };
    }

    async deleteAllOf(ideaId: string): Promise<string[]> {
        const features = await this.features.findByOwner(FeatureOwner.idea(ideaId));
        const urls: string[] = [];
        for (const feature of features) {
            urls.push(...(await this.tickets.deleteAllOf(feature.getId().getValue())));
            urls.push(...feature.getDocuments().map(d => d.getUrl()));
            await this.features.delete(feature.getId());
        }
        return urls;
    }

    async transferToProject(ideaId: string, projectId: string): Promise<void> {
        const features = await this.features.findByOwner(FeatureOwner.idea(ideaId));
        const owner = FeatureOwner.project(projectId);
        for (const feature of features) {
            // Le numéro de la feature ne bouge pas, et celui du porteur non plus : les références
            // des tickets restent donc exactes sans être réécrites.
            feature.transferTo(owner);
            await this.features.save(feature);
        }
    }
}
