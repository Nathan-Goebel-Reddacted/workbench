import { FeatureOwner } from '../valueObject/featureOwner';

/**
 * Ce que le contexte Feature a le droit de savoir d'un porteur, et rien de plus. Il ne lit ni la
 * table des projets ni celle des idées : il pose ses deux questions à ceux qui détiennent la
 * réponse, et chacun répond pour lui-même.
 */
export interface IOwnerGateway {
    /** Ce porteur existe-t-il ? Une feature sans porteur réel n'a pas le droit d'être créée. */
    exists(owner: FeatureOwner): Promise<boolean>;

    /** Numéro du porteur — premier segment des références. `null` si le porteur a disparu. */
    numberOf(owner: FeatureOwner): Promise<number | null>;
}
