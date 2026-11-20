import { PageId } from './valueObject/pageId';
import { PageType } from './valueObject/pageType';
import { PageRef } from './valueObject/pageRef';
import { ElementId } from './valueObject/elementId';
import { Transform } from './valueObject/transform';
import { Layout, Placement } from './valueObject/layout';
import { DERIVED_SCREENS, DerivedScreen, MAX_SCREEN_HEIGHTS, SCREEN_SIZES, ScreenSize } from './valueObject/screenSize';
import { fitFirstContent, placeAt, placeBelow, regenerate } from './layout/deriveLayout';
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
        return this.elements.some(e => e.hasContent() && !e.getLayout().hiddenEverywhere());
    }

    addElement(id: ElementId, screen: ScreenSize = 'desktop', visibleTop?: number): Element {
        if (this.elements.length >= MAX_ELEMENTS) throw new TooManyElementsException(MAX_ELEMENTS);
        const onDesktop = screen === 'desktop' ? visibleTop : undefined;
        const wanted = onDesktop !== undefined ? onDesktop + NEW_ELEMENT_GAP : this.bottom('desktop') + NEW_ELEMENT_GAP;
        const y = Math.min(Math.max(Math.round(wanted), 0), MAX_SCREEN_HEIGHTS.desktop - NEW_ELEMENT_HEIGHT);
        const x = (SCREEN_SIZES.desktop - NEW_ELEMENT_WIDTH) / 2;
        const desktop = new Transform('desktop', x, y, NEW_ELEMENT_WIDTH, NEW_ELEMENT_HEIGHT);
        const derived = (target: DerivedScreen): Placement => ({
            transform:
                target === screen && visibleTop !== undefined
                    ? placeAt(target, visibleTop + NEW_ELEMENT_GAP, desktop)
                    : placeBelow(target, this.bottom(target), desktop),
            hidden: false,
        });
        const element = Element.create(
            id,
            Layout.of(
                {
                    desktop: { transform: desktop, hidden: false },
                    tablet: derived('tablet'),
                    mobile: derived('mobile'),
                },
                screen,
            ),
        );
        this.elements.push(element);
        return element;
    }

    moveElement(id: ElementId, transform: Transform): void {
        this.find(id).moveTo(transform);
    }

    hideElement(id: ElementId, screen: ScreenSize, hidden: boolean): void {
        this.find(id).hide(screen, hidden);
    }

    regenerateLayout(screen: DerivedScreen): void {
        for (const element of this.elements) element.regenerateComponents(screen);
        const placements = regenerate(
            screen,
            this.elements.map(element => ({
                id: element.getId().getValue(),
                desktop: element.transform('desktop'),
                hiddenOnDesktop: element.getLayout().isHidden('desktop'),
                flow: element.contentFlow(),
                heightRatio: element.heightRatio(screen),
            })),
        );
        for (const element of this.elements) {
            const placement = placements.get(element.getId().getValue());
            if (placement) element.relayout(element.getLayout().with(screen, placement));
        }
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
        const layout = source
            .getLayout()
            .map(placement => ({ ...placement, transform: placement.transform.offset(DUPLICATE_OFFSET) }));
        const copy = source.duplicate(id, layout);
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
        const hadContent = element.hasContent();
        const previous = element.setComponent(parseComponentKind(kind), raw, siteOrigins);
        if (!hadContent && element.hasContent()) {
            for (const screen of DERIVED_SCREENS.filter(s => s !== element.getLayout().getOrigin())) {
                element.moveTo(
                    fitFirstContent(
                        element.transform(screen),
                        element.transform('desktop'),
                        element.contentFlow(),
                        element.heightRatio(screen),
                    ),
                );
            }
        }
        return previous;
    }

    removeComponent(id: ElementId, kind: string): ComponentValue | null {
        const element = this.find(id);
        return element.removeComponent(parseComponentKind(kind));
    }

    private bottom(screen: ScreenSize): number {
        return this.elements
            .filter(e => !e.getLayout().isHidden(screen))
            .reduce((max, e) => Math.max(max, e.transform(screen).bottom()), 0);
    }

    private find(id: ElementId): Element {
        const element = this.elements.find(e => e.getId().equals(id));
        if (!element) throw new ElementNotFoundException(id.getValue());
        return element;
    }
}
