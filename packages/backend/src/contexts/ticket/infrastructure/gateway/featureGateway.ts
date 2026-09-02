import { QueryBus } from '@shared/application/query/queryBus';
import { FeatureContext, IFeatureGateway } from '../../domain/port/iFeatureGateway';
import { GetFeatureByIdQuery } from '@contexts/feature/application/query/getFeatureById/getFeatureByIdQuery';
import { FeatureDto } from '@contexts/feature/application/query/getFeatureById/featureDto';

/**
 * Passe par le contrat public du contexte Feature — sa query — plutôt que par son repository :
 * le contexte Ticket ne sait rien de la façon dont les features sont stockées, et c'est Feature
 * qui va lui-même demander son numéro au porteur.
 */
export class FeatureGateway implements IFeatureGateway {
    constructor(private readonly queryBus: QueryBus) {}

    async describe(featureId: string): Promise<FeatureContext | null> {
        const feature = (await this.queryBus.dispatch(new GetFeatureByIdQuery(featureId))) as FeatureDto | null;
        if (!feature) return null;

        // Une référence vide signale un porteur disparu : sans lui, aucun numéro n'est calculable.
        if (feature.reference === '') return null;

        return {
            ownerType: feature.ownerType,
            ownerNumber: parseInt(feature.reference.split('.')[0], 10),
            featureNumber: feature.number,
        };
    }
}
