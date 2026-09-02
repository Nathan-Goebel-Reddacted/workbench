import { Idea } from '../ideaAggregate';

export interface IIdeaRepository {
    findById(id: string): Promise<Idea | null>;
    findAll(): Promise<Idea[]>;
    save(idea: Idea): Promise<void>;
    delete(id: string): Promise<void>;
}
