import { Project } from '../../domain/projectAggregate';

export type ProjectDestination =
    | Readonly<{ kind: 'page' }>
    | Readonly<{ kind: 'external'; url: string }>
    | Readonly<{ kind: 'none' }>;

export function destinationOf(project: Project, hasPage: boolean): ProjectDestination {
    const replacing = project.getReplacingLink();
    if (replacing) return { kind: 'external', url: replacing.getUrl() };

    return hasPage ? { kind: 'page' } : { kind: 'none' };
}
