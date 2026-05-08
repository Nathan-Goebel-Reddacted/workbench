import { Idea } from "../ideaAggregate";

export interface IIdeaRepository {
    findById(id: string): Promise<Idea | null>;
    save(idea: Idea): Promise<void>;
}
