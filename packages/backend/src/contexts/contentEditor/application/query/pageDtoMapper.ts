import { IUploadPresence } from '@shared/application/port/iUploadPresence';
import { Page } from '../../domain/pageAggregate';
import { REFERENCE_WIDTH } from '../../domain/valueObject/transform';
import { ElementComponents } from '../../domain/entity/element';
import {
    COMPONENT_REGISTRY,
    ComponentDescriptor,
    ComponentKind,
    ComponentValue,
} from '../../domain/component/componentRegistry';
import { IProjectReferences, LinkDestination, ProjectSummary } from '../../domain/port/iProjectReferences';
import { ElementDto, ElementIssue, PageDto } from './pageDto';

export type PageReaders = Readonly<{ projects: IProjectReferences; presence: IUploadPresence }>;

export type Audience = 'public' | 'editor';

type Cited = Readonly<{ missing: ReadonlySet<string>; projects: ReadonlyMap<string, ProjectSummary> }>;

export async function toPageDto(page: Page, readers: PageReaders, audience: Audience): Promise<PageDto> {
    const elements = page.getElements();
    const components = elements.map(e => e.getComponents());
    const [missing, projects] = await Promise.all([
        readers.presence.missing(components.flatMap(c => cited(c, 'files').filter(isLocalFile))),
        readers.projects.summariesOf(components.flatMap(c => cited(c, 'projects'))),
    ]);
    const known: Cited = { missing, projects };

    const dtos = elements.flatMap((element, index): ElementDto[] => {
        const issues = issuesOf(components[index], known);
        const shown = audience === 'public' ? withoutBrokenReferences(components[index], known) : components[index];
        if (shown === null) return [];
        const t = element.getTransform();
        return [
            {
                id: element.getId().getValue(),
                transform: { x: t.getX(), y: t.getY(), w: t.getW(), h: t.getH() },
                components: withProjects(shown, known),
                issues: audience === 'editor' ? issues : [],
            },
        ];
    });

    return {
        id: page.getId().getValue(),
        pageType: page.getPageType(),
        pageRef: page.getPageRef().getValue(),
        version: page.getVersion(),
        referenceWidth: REFERENCE_WIDTH,
        hasContent: page.hasContent(),
        elements: dtos,
    };
}

function entries(components: ElementComponents): Array<[ComponentKind, ComponentValue]> {
    return Object.entries(components) as Array<[ComponentKind, ComponentValue]>;
}

function descriptorOf(kind: ComponentKind): ComponentDescriptor {
    return COMPONENT_REGISTRY[kind];
}

function cited(components: ElementComponents, what: 'files' | 'projects'): string[] {
    return entries(components).flatMap(([kind, value]) => descriptorOf(kind)[what]?.(value) ?? []);
}

function isLocalFile(url: string): boolean {
    return url.startsWith('/uploads/');
}

function isAvailable(projectId: string, known: Cited): boolean {
    return known.projects.get(projectId)?.visible === true;
}

function issuesOf(components: ElementComponents, known: Cited): ElementIssue[] {
    const files = cited(components, 'files')
        .filter(url => isLocalFile(url) && known.missing.has(url))
        .map((url): ElementIssue => ({ kind: 'missingFile', url }));
    const projects = cited(components, 'projects')
        .filter(projectId => !isAvailable(projectId, known))
        .map((projectId): ElementIssue => ({ kind: 'projectUnavailable', projectId }));
    return [...files, ...projects];
}

function withoutBrokenReferences(components: ElementComponents, known: Cited): ElementComponents | null {
    const card = components.projectCard?.projectId;
    if (typeof card === 'string' && !isAvailable(card, known)) return null;
    if (known.missing.size === 0) return components;
    const kept: ElementComponents = {};
    for (const [kind, value] of entries(components)) {
        const { withoutFiles } = descriptorOf(kind);
        const pruned = withoutFiles ? withoutFiles(value, known.missing) : value;
        if (pruned === null) return null;
        kept[kind] = pruned;
    }
    return kept;
}

function destinationOf(projectId: unknown, known: Cited): LinkDestination | null {
    if (typeof projectId !== 'string') return null;
    const summary = known.projects.get(projectId);
    return summary?.visible ? summary.destination : { kind: 'none' };
}

function withProjects(components: ElementComponents, known: Cited): ElementComponents {
    const result: ElementComponents = { ...components };
    if (components.link) {
        result.link = { ...components.link, destination: destinationOf(components.link.projectId, known) };
    }
    if (components.projectCard) {
        const projectId = components.projectCard.projectId;
        const summary = typeof projectId === 'string' ? known.projects.get(projectId) : undefined;
        result.projectCard = {
            ...components.projectCard,
            project: summary
                ? {
                      name: summary.name,
                      description: summary.description,
                      image: summary.image,
                      destination: destinationOf(projectId, known),
                  }
                : null,
        };
    }
    return result;
}
