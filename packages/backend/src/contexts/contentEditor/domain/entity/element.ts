import { ElementId } from '../valueObject/elementId';
import { Transform } from '../valueObject/transform';
import {
    COMPONENT_REGISTRY,
    ComponentKind,
    ComponentValue,
    contentConflict,
    isComponentKind,
    LINK_KIND,
    linkConflict,
    normalizeComponent,
} from '../component/componentRegistry';
import { ContentAlreadyPresentException } from '../exception/contentAlreadyPresent';
import { LinkOnInteractiveContentException } from '../exception/linkOnInteractiveContent';

export type ElementComponents = Partial<Record<ComponentKind, ComponentValue>>;

export class Element {
    private constructor(
        private readonly id: ElementId,
        private transform: Transform,
        private components: ElementComponents,
    ) {}

    static create(id: ElementId, transform: Transform): Element {
        return new Element(id, transform, {});
    }

    static rehydrate(id: ElementId, transform: Transform, raw: Record<string, unknown>): Element {
        const components: ElementComponents = {};
        for (const [kind, value] of Object.entries(raw)) {
            if (!isComponentKind(kind)) continue;
            const kinds = Element.kindsOf(components);
            if (contentConflict(kinds, kind, COMPONENT_REGISTRY)) continue;
            if (linkConflict(kinds, kind, COMPONENT_REGISTRY, LINK_KIND)) continue;
            const normalized = normalizeComponent(kind, value, false);
            if (normalized) components[kind] = normalized;
        }
        return new Element(id, transform, components);
    }

    duplicate(id: ElementId, transform: Transform): Element {
        return new Element(id, transform, structuredClone(this.components));
    }

    getId(): ElementId {
        return this.id;
    }

    getTransform(): Transform {
        return this.transform;
    }

    getComponents(): ElementComponents {
        return structuredClone(this.components);
    }

    hasContent(): boolean {
        return Element.kindsOf(this.components).some(kind => COMPONENT_REGISTRY[kind].role === 'content');
    }

    moveTo(transform: Transform): void {
        this.transform = transform;
    }

    setComponent(kind: ComponentKind, raw: unknown): ComponentValue | null {
        const kinds = Element.kindsOf(this.components);
        const present = contentConflict(kinds, kind, COMPONENT_REGISTRY);
        if (present) throw new ContentAlreadyPresentException(present, kind);
        const interactive = linkConflict(kinds, kind, COMPONENT_REGISTRY, LINK_KIND);
        if (interactive) throw new LinkOnInteractiveContentException(interactive);
        const value = normalizeComponent(kind, raw, true) as ComponentValue;
        const previous = this.components[kind] ?? null;
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
