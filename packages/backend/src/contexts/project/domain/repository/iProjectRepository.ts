import { Project } from '../projectAggregate';
import { ProjectId } from '../valueObject/projectId';

export interface IProjectRepository {
    findById(id: ProjectId): Promise<Project | null>;
    findAll(): Promise<Project[]>;
    save(project: Project): Promise<void>;
}
