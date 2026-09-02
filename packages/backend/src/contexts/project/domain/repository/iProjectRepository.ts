import { Project } from '../projectAggregate';

export interface IProjectRepository {
    findById(id: string): Promise<Project | null>;
    findAll(): Promise<Project[]>;
    save(project: Project): Promise<void>;
}
