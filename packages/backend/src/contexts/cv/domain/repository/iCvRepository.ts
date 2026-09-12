import { Cv } from '../cvAggregate';
import { CvId } from '../valueObject/cvId';

export interface ICvRepository {
    /** Tous les CV, dans l'ordre d'affichage. */
    findAll(): Promise<Cv[]>;
    findById(id: CvId): Promise<Cv | null>;
    save(cv: Cv): Promise<void>;
    /** Écrit une liste entière — c'est le réordonnancement, qui touche tout le monde. */
    saveAll(cvs: Cv[]): Promise<void>;
    delete(id: CvId): Promise<void>;
    /** Prochaine place libre en fin de liste. */
    nextDisplayOrder(): Promise<number>;
}
