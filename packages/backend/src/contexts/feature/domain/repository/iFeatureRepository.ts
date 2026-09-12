import { Feature } from '../featureAggregate';
import { OwnerType } from '../valueObject/featureOwner';

export interface IFeatureRepository {
    findById(id: string): Promise<Feature | null>;
    /** Les features d'un porteur — un projet ou une idée — dans l'ordre de leur numéro. */
    findByOwner(ownerType: OwnerType, ownerId: string): Promise<Feature[]>;
    /**
     * Les features de plusieurs porteurs d'un coup. Existe pour les lectures qui parcourent
     * tout l'atelier : les demander porteur par porteur multiplie les allers-retours par le
     * nombre de projets.
     */
    findByOwners(ownerType: OwnerType, ownerIds: string[]): Promise<Feature[]>;
    existsById(id: string): Promise<boolean>;
    /** Plus grand numéro déjà attribué chez ce porteur ; 0 s'il n'en a aucun. */
    lastNumberOf(ownerType: OwnerType, ownerId: string): Promise<number>;
    save(feature: Feature): Promise<void>;
    delete(id: string): Promise<void>;
}
