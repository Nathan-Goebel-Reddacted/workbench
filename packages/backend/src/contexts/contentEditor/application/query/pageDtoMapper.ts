import { IUploadPresence } from '@shared/application/port/iUploadPresence';
import { Page } from '../../domain/pageAggregate';
import {
    MAX_SCREEN_HEIGHTS,
    SCREEN_MIN_VIEWPORTS,
    SCREEN_SIZES,
    SCREENS,
    ScreenSize,
} from '../../domain/valueObject/screenSize';
import { Layout } from '../../domain/valueObject/layout';
import { ElementComponents } from '../../domain/entity/element';
import {
    COMPONENT_REGISTRY,
    ComponentDescriptor,
    ComponentKind,
    ComponentValue,
} from '../../domain/component/componentRegistry';
import { IProjectReferences, LinkDestination, ProjectSummary } from '../../domain/port/iProjectReferences';
import { IBindingTargets } from '../../domain/port/iBindingTargets';
import { BindingRef, bindingKey } from '../../domain/component/bindings';
import { ElementDto, ElementIssue, PageDto, PlacementDto, ScreenDto } from './pageDto';

export type PageReaders = Readonly<{
    projects: IProjectReferences;
    presence: IUploadPresence;
    bindings: IBindingTargets;
}>;

export type Audience = 'public' | 'editor';

type Cited = Readonly<{
    missing: ReadonlySet<string>;
    projects: ReadonlyMap<string, ProjectSummary>;
    missingBindings: ReadonlySet<string>;
}>;

export async function toPageDto(page: Page, readers: PageReaders, audience: Audience): Promise<PageDto> {
    const elements = page.getElements();
    const components = elements.map(e => e.getComponents());
    const bindings = audience === 'editor' ? components.flatMap(bindingsOf) : [];
    const [missing, projects, missingBindings] = await Promise.all([
        readers.presence.missing(components.flatMap(c => cited(c, 'files').filter(isLocalFile))),
        readers.projects.summariesOf(components.flatMap(c => cited(c, 'projects'))),
        bindings.length > 0 ? readers.bindings.missing(bindings) : new Set<string>(),
    ]);
    const known: Cited = { missing, projects, missingBindings };

    const dtos = elements.flatMap((element, index): ElementDto[] => {
        const issues = issuesOf(components[index], known);
        const shown = audience === 'public' ? withoutBrokenReferences(components[index], known) : components[index];
        if (shown === null) return [];
        return [
            {
                id: element.getId().getValue(),
                layout: layoutDto(element.getLayout()),
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
        screens: SCREENS_DTO,
        hasContent: page.hasContent(),
        elements: dtos,
    };
}

const SCREENS_DTO = Object.fromEntries(
    SCREENS.map(screen => [
        screen,
        {
            width: SCREEN_SIZES[screen],
            maxHeight: MAX_SCREEN_HEIGHTS[screen],
            minViewport: SCREEN_MIN_VIEWPORTS[screen],
        },
    ]),
) as Record<ScreenSize, ScreenDto>;

function layoutDto(layout: Layout): Record<ScreenSize, PlacementDto> {
    return Object.fromEntries(
        SCREENS.map(screen => {
            const t = layout.transform(screen);
            return [
                screen,
                { transform: { x: t.getX(), y: t.getY(), w: t.getW(), h: t.getH() }, hidden: layout.isHidden(screen) },
            ];
        }),
    ) as Record<ScreenSize, PlacementDto>;
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

function bindingsOf(components: ElementComponents): BindingRef[] {
    return entries(components).flatMap(([kind, value]) => descriptorOf(kind).bindings?.(value) ?? []);
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
    const bindings = bindingsOf(components)
        .filter(ref => known.missingBindings.has(bindingKey(ref)))
        .map((ref): ElementIssue => ({ kind: 'missingBinding', entity: ref.entity, id: ref.id }));
    return [...files, ...projects, ...bindings];
}

function withoutBrokenReferences(components: ElementComponents, known: Cited): ElementComponents | null {
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
    return result;
}
