import { Project } from "../projectAggregate";

export interface IProjectRepository {
    findById(id: string): Promise<Project | null>;
    save(project: Project): Promise<void>;
}
