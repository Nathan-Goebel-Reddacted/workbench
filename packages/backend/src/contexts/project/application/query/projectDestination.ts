import { Project } from '../../domain/projectAggregate';
import { IProjectPageGateway } from '../../domain/port/iProjectPageGateway';

export type ProjectDestination =
    | Readonly<{ kind: 'page' }>
    | Readonly<{ kind: 'external'; url: string }>
    | Readonly<{ kind: 'none' }>;

export async function destinationOf(project: Project, pages: IProjectPageGateway): Promise<ProjectDestination> {
    const replacing = project.getReplacingLink();
    if (replacing) return { kind: 'external', url: replacing.getUrl() };

    return (await pages.hasSections(project.getId().getValue())) ? { kind: 'page' } : { kind: 'none' };
}
