import { ElementId } from '../valueObject/elementId';
import { Layout } from '../valueObject/layout';
import { DerivedScreen, ScreenSize } from '../valueObject/screenSize';
import { Transform } from '../valueObject/transform';
import { ContentFlow } from '../layout/deriveLayout';
import {
    COMPONENT_REGISTRY,
    ComponentDescriptor,
    ComponentKind,
    ComponentValue,
    contentConflict,
    isComponentKind,
    LINK_KIND,
    linkConflict,
    normalizeComponent,
} from '../component/componentRegistry';
import { ContentAlreadyPresentException } from '../exception/contentAlreadyPresent';
import { SiteOrigins } from '../valueObject/siteOrigins';
import { LinkOnInteractiveContentException } from '../exception/linkOnInteractiveContent';

export type ElementComponents = Partial<Record<ComponentKind, ComponentValue>>;

export class Element {
    private constructor(
        private readonly id: ElementId,
        private layout: Layout,
        private components: ElementComponents,
    ) {}

    static create(id: ElementId, layout: Layout): Element {
        return new Element(id, layout, {});
    }

    static rehydrate(id: ElementId, layout: Layout, raw: Record<string, unknown>): Element {
        const components: ElementComponents = {};
        for (const [kind, value] of Object.entries(raw)) {
            if (!isComponentKind(kind)) continue;
            const kinds = Element.kindsOf(components);
            if (contentConflict(kinds, kind, COMPONENT_REGISTRY)) continue;
            if (linkConflict(kinds, kind, COMPONENT_REGISTRY, LINK_KIND)) continue;
            const normalized = normalizeComponent(kind, value, false);
            if (normalized) components[kind] = normalized;
        }
        return new Element(id, layout, components);
    }

    duplicate(id: ElementId, layout: Layout): Element {
        return new Element(id, layout, structuredClone(this.components));
    }

    getId(): ElementId {
        return this.id;
    }

    getLayout(): Layout {
        return this.layout;
    }

    transform(screen: ScreenSize): Transform {
        return this.layout.transform(screen);
    }

    getComponents(): ElementComponents {
        return structuredClone(this.components);
    }

    hasContent(): boolean {
        return Element.kindsOf(this.components).some(kind => COMPONENT_REGISTRY[kind].role === 'content');
    }

    contentFlow(): ContentFlow {
        const kind = this.contentKind();
        return kind ? COMPONENT_REGISTRY[kind].flow : null;
    }

    heightRatio(screen: DerivedScreen): number {
        const kind = this.contentKind();
        if (!kind) return 1;
        const { heightRatio } = COMPONENT_REGISTRY[kind] as ComponentDescriptor;
        return heightRatio ? heightRatio(this.components[kind] as ComponentValue, screen) : 1;
    }

    regenerateComponents(screen: DerivedScreen): void {
        const next: ElementComponents = { ...this.components };
        for (const kind of Element.kindsOf(this.components)) {
            const { regenerate } = COMPONENT_REGISTRY[kind] as ComponentDescriptor;
            if (regenerate) next[kind] = regenerate(this.components[kind] as ComponentValue, screen);
        }
        this.components = next;
    }

    private contentKind(): ComponentKind | undefined {
        return Element.kindsOf(this.components).find(k => COMPONENT_REGISTRY[k].role === 'content');
    }

    moveTo(transform: Transform): void {
        this.layout = this.layout.with(transform.getScreen(), { transform });
    }

    hide(screen: ScreenSize, hidden: boolean): void {
        this.layout = this.layout.with(screen, { hidden });
    }

    relayout(layout: Layout): void {
        this.layout = layout;
    }

    setComponent(
        kind: ComponentKind,
        raw: unknown,
        siteOrigins: SiteOrigins = SiteOrigins.none(),
    ): ComponentValue | null {
        const kinds = Element.kindsOf(this.components);
        const present = contentConflict(kinds, kind, COMPONENT_REGISTRY);
        if (present) throw new ContentAlreadyPresentException(present, kind);
        const interactive = linkConflict(kinds, kind, COMPONENT_REGISTRY, LINK_KIND);
        if (interactive) throw new LinkOnInteractiveContentException(interactive);
        const normalized = normalizeComponent(kind, raw, true, siteOrigins) as ComponentValue;
        const previous = this.components[kind] ?? null;
        const { reconcile } = COMPONENT_REGISTRY[kind] as ComponentDescriptor;
        const value = previous && reconcile ? reconcile(previous, normalized) : normalized;
        this.components = { ...this.components, [kind]: value };
        return previous;
    }

    removeComponent(kind: ComponentKind): ComponentValue | null {
        const previous = this.components[kind] ?? null;
        if (previous === null) return null;
        const { [kind]: _removed, ...rest } = this.components;
        this.components = rest;
        return previous;
    }

    private static kindsOf(components: ElementComponents): ComponentKind[] {
        return Object.keys(components) as ComponentKind[];
    }
}
