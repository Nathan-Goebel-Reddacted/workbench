import { Cv } from '../cvAggregate';

export interface ICvRepository {
    findAll(): Promise<Cv[]>;
    findById(id: string): Promise<Cv | null>;
    save(cv: Cv): Promise<void>;
    saveAll(cvs: Cv[]): Promise<void>;
    delete(id: string): Promise<void>;
    nextDisplayOrder(): Promise<number>;
}
