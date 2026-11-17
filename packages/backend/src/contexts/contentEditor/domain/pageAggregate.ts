import { PageId } from './valueObject/pageId';
import { PageType } from './valueObject/pageType';
import { PageRef } from './valueObject/pageRef';
import { ElementId } from './valueObject/elementId';
import { MAX_PAGE_HEIGHT, REFERENCE_WIDTH, Transform } from './valueObject/transform';
import { Element } from './entity/element';
import { ComponentValue, parseComponentKind } from './component/componentRegistry';
import { ElementNotFoundException } from './exception/elementNotFound';
import { TooManyElementsException } from './exception/tooManyElements';
import { SiteOrigins } from './valueObject/siteOrigins';

export const MAX_ELEMENTS = 200;
export const NEW_ELEMENT_WIDTH = 480;
export const NEW_ELEMENT_HEIGHT = 160;
export const NEW_ELEMENT_GAP = 40;
export const DUPLICATE_OFFSET = 20;

export type ReorderDirection = 'forward' | 'backward';

export class Page {
    private elements: Element[];

    constructor(
        private readonly id: PageId,
        private readonly pageType: PageType,
        private readonly pageRef: PageRef,
        elements: Element[] = [],
        private readonly version: number = 0,
    ) {
        this.elements = elements;
    }

    getVersion(): number {
        return this.version;
    }

    getId(): PageId {
        return this.id;
    }

    getPageType(): PageType {
        return this.pageType;
    }

    getPageRef(): PageRef {
        return this.pageRef;
    }

    getElements(): Element[] {
        return [...this.elements];
    }

    hasContent(): boolean {
        return this.elements.some(e => e.hasContent());
    }

    addElement(id: ElementId, visibleTop?: number): Element {
        if (this.elements.length >= MAX_ELEMENTS) throw new TooManyElementsException(MAX_ELEMENTS);
        const wanted = visibleTop !== undefined ? visibleTop + NEW_ELEMENT_GAP : this.bottom() + NEW_ELEMENT_GAP;
        const y = Math.min(Math.max(Math.round(wanted), 0), MAX_PAGE_HEIGHT - NEW_ELEMENT_HEIGHT);
        const x = (REFERENCE_WIDTH - NEW_ELEMENT_WIDTH) / 2;
        const element = Element.create(id, new Transform(x, y, NEW_ELEMENT_WIDTH, NEW_ELEMENT_HEIGHT));
        this.elements.push(element);
        return element;
    }

    moveElement(id: ElementId, transform: Transform): void {
        this.find(id).moveTo(transform);
    }

    reorderElement(id: ElementId, direction: ReorderDirection): void {
        const index = this.elements.indexOf(this.find(id));
        const neighbour = direction === 'forward' ? index + 1 : index - 1;
        if (neighbour < 0 || neighbour >= this.elements.length) return;
        [this.elements[index], this.elements[neighbour]] = [this.elements[neighbour], this.elements[index]];
    }

    duplicateElement(sourceId: ElementId, id: ElementId): Element {
        if (this.elements.length >= MAX_ELEMENTS) throw new TooManyElementsException(MAX_ELEMENTS);
        const source = this.find(sourceId);
        const t = source.getTransform();
        const x = Math.min(t.getX() + DUPLICATE_OFFSET, REFERENCE_WIDTH - t.getW());
        const y = Math.min(t.getY() + DUPLICATE_OFFSET, MAX_PAGE_HEIGHT - t.getH());
        const copy = source.duplicate(id, new Transform(x, y, t.getW(), t.getH()));
        this.elements.splice(this.elements.indexOf(source) + 1, 0, copy);
        return copy;
    }

    removeElement(id: ElementId): Element {
        const element = this.find(id);
        this.elements = this.elements.filter(e => e !== element);
        return element;
    }

    setComponent(
        id: ElementId,
        kind: string,
        raw: unknown,
        siteOrigins: SiteOrigins = SiteOrigins.none(),
    ): ComponentValue | null {
        const element = this.find(id);
        return element.setComponent(parseComponentKind(kind), raw, siteOrigins);
    }

    removeComponent(id: ElementId, kind: string): ComponentValue | null {
        const element = this.find(id);
        return element.removeComponent(parseComponentKind(kind));
    }

    private bottom(): number {
        return this.elements.reduce((max, e) => Math.max(max, e.getTransform().bottom()), 0);
    }

    private find(id: ElementId): Element {
        const element = this.elements.find(e => e.getId().equals(id));
        if (!element) throw new ElementNotFoundException(id.getValue());
        return element;
    }
}
