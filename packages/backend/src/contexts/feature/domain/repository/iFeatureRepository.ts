import { Feature } from '../featureAggregate';
import { FeatureId } from '../valueObject/featureId';
import { FeatureOwner } from '../valueObject/featureOwner';

export interface IFeatureRepository {
    findById(id: FeatureId): Promise<Feature | null>;
    /** Les features d'un porteur — un projet ou une idée — dans l'ordre de leur numéro. */
    findByOwner(owner: FeatureOwner): Promise<Feature[]>;
    /**
     * Les features de plusieurs porteurs d'un coup. Existe pour les lectures qui parcourent
     * tout l'atelier : les demander porteur par porteur multiplie les allers-retours par le
     * nombre de projets.
     */
    findByOwners(owners: FeatureOwner[]): Promise<Feature[]>;
    /** Plus grand numéro déjà attribué chez ce porteur ; 0 s'il n'en a aucun. */
    lastNumberOf(owner: FeatureOwner): Promise<number>;
    save(feature: Feature): Promise<void>;
    delete(id: FeatureId): Promise<void>;
}
