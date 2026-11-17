import { Page } from '../../domain/pageAggregate';
import { REFERENCE_WIDTH } from '../../domain/valueObject/transform';
import { ElementComponents } from '../../domain/entity/element';
import { IProjectDestinations, LinkDestination } from '../../domain/port/iProjectDestinations';
import { PageDto } from './pageDto';

export async function toPageDto(page: Page, destinations: IProjectDestinations): Promise<PageDto> {
    const elements = page.getElements();
    const projectIds = elements.flatMap(e => linkedProject(e.getComponents()) ?? []);
    const resolved = await destinations.destinationsOf(projectIds);

    return {
        id: page.getId().getValue(),
        pageType: page.getPageType(),
        pageRef: page.getPageRef().getValue(),
        version: page.getVersion(),
        referenceWidth: REFERENCE_WIDTH,
        hasContent: page.hasContent(),
        elements: elements.map(element => {
            const t = element.getTransform();
            return {
                id: element.getId().getValue(),
                transform: { x: t.getX(), y: t.getY(), w: t.getW(), h: t.getH() },
                components: withDestination(element.getComponents(), resolved),
            };
        }),
    };
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
