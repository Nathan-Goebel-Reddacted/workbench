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
import { IProjectDestinations, LinkDestination } from '../../domain/port/iProjectDestinations';
import { ElementDto, ElementIssue, PageDto } from './pageDto';

export type PageReaders = Readonly<{ destinations: IProjectDestinations; presence: IUploadPresence }>;

export type Audience = 'public' | 'editor';

export async function toPageDto(page: Page, readers: PageReaders, audience: Audience): Promise<PageDto> {
    const elements = page.getElements();
    const components = elements.map(e => e.getComponents());
    const [destinations, missing] = await Promise.all([
        readers.destinations.destinationsOf(components.flatMap(c => linkedProject(c) ?? [])),
        readers.presence.missing(components.flatMap(localFiles)),
    ]);

    const dtos = elements.flatMap((element, index): ElementDto[] => {
        const issues = missingIssues(components[index], missing);
        const shown = audience === 'public' ? withoutMissingFiles(components[index], missing) : components[index];
        if (shown === null) return [];
        const t = element.getTransform();
        return [
            {
                id: element.getId().getValue(),
                transform: { x: t.getX(), y: t.getY(), w: t.getW(), h: t.getH() },
                components: withDestination(shown, destinations),
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

function filesOf(kind: ComponentKind, value: ComponentValue): string[] {
    const descriptor: ComponentDescriptor = COMPONENT_REGISTRY[kind];
    return descriptor.files?.(value) ?? [];
}

function localFiles(components: ElementComponents): string[] {
    return entries(components).flatMap(([kind, value]) => filesOf(kind, value).filter(isLocalFile));
}

function isLocalFile(url: string): boolean {
    return url.startsWith('/uploads/');
}

function missingIssues(components: ElementComponents, missing: ReadonlySet<string>): ElementIssue[] {
    return localFiles(components)
        .filter(url => missing.has(url))
        .map(url => ({ kind: 'missingFile', url }));
}

function withoutMissingFiles(components: ElementComponents, missing: ReadonlySet<string>): ElementComponents | null {
    if (missing.size === 0) return components;
    const kept: ElementComponents = {};
    for (const [kind, value] of entries(components)) {
        const descriptor: ComponentDescriptor = COMPONENT_REGISTRY[kind];
        const pruned = descriptor.withoutFiles ? descriptor.withoutFiles(value, missing) : value;
        if (pruned === null) return null;
        kept[kind] = pruned;
    }
    return kept;
}

function linkedProject(components: ElementComponents): string | null {
    const projectId = components.link?.projectId;
    return typeof projectId === 'string' ? projectId : null;
}

function withDestination(
    components: ElementComponents,
    resolved: ReadonlyMap<string, LinkDestination>,
): ElementComponents {
    if (!components.link) return components;
    const projectId = linkedProject(components);
    const destination: LinkDestination | null = projectId ? (resolved.get(projectId) ?? { kind: 'none' }) : null;
    return { ...components, link: { ...components.link, destination } };
}
