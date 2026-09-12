import { Idea } from '../ideaAggregate';
import { IdeaId } from '../valueObject/ideaId';

export interface IIdeaRepository {
    findById(id: IdeaId): Promise<Idea | null>;
    findAll(): Promise<Idea[]>;
    save(idea: Idea): Promise<void>;
    delete(id: IdeaId): Promise<void>;
}
