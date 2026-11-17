import { describe, expect, it } from 'vitest';
import { Page } from './pageAggregate.js';
import { PageId } from './valueObject/pageId.js';
import { PageType } from './valueObject/pageType.js';
import { PageRef } from './valueObject/pageRef.js';
import { ElementId } from './valueObject/elementId.js';
import { MAX_PAGE_HEIGHT, REFERENCE_WIDTH, Transform } from './valueObject/transform.js';
import { Element } from './entity/element.js';
import { ComponentDescriptor, contentConflict } from './component/componentRegistry.js';
import { ElementNotFoundException } from './exception/elementNotFound.js';
import { InvalidTransformException } from './exception/invalidTransform.js';
import { InvalidComponentException } from './exception/invalidComponent.js';
import { UnknownComponentKindException } from './exception/unknownComponentKind.js';
import { TooManyElementsException } from './exception/tooManyElements.js';
import { MAX_ELEMENTS } from './pageAggregate.js';

function page(elements: Element[] = []): Page {
    return new Page(new PageId(), PageType.PORTFOLIO, new PageRef(), elements);
}

function element(transform = new Transform(0, 0, 100, 100), components: Record<string, unknown> = {}): Element {
    return Element.rehydrate(new ElementId(), transform, components);
}

describe('Transform', () => {
    it('accepte une boîte entière dans la largeur de référence', () => {
        expect(() => new Transform(0, 0, REFERENCE_WIDTH, 1)).not.toThrow();
    });

    it.each([
        [-1, 0, 10, 10],
        [0, -1, 10, 10],
        [0, 0, 0, 10],
        [0, 0, 10, 0],
        [1, 0, REFERENCE_WIDTH, 10],
        [0, MAX_PAGE_HEIGHT - 9, 10, 10],
        [0.5, 0, 10, 10],
        [0, 0, Number.NaN, 10],
        [0, 0, Number.POSITIVE_INFINITY, 10],
    ])('refuse x=%s y=%s w=%s h=%s', (x, y, w, h) => {
        expect(() => new Transform(x, y, w, h)).toThrow(InvalidTransformException);
    });
});

describe('Page — placement initial', () => {
    it('centre un nouvel Element sous le plus bas quand rien n’indique la zone visible', () => {
        const p = page([element(new Transform(0, 100, 200, 300))]);

        const added = p.addElement(new ElementId());

        const t = added.getTransform();
        expect(t.getX()).toBe((REFERENCE_WIDTH - t.getW()) / 2);
        expect(t.getY()).toBe(400 + 40);
    });

    it('pose un nouvel Element en haut de la zone visible quand elle est indiquée', () => {
        const p = page([element(new Transform(0, 5000, 200, 300))]);

        const added = p.addElement(new ElementId(), 1200);

        expect(added.getTransform().getY()).toBe(1240);
    });

    it('ramène un nouvel Element sous la hauteur maximale de la Page', () => {
        const p = page([element(new Transform(0, MAX_PAGE_HEIGHT - 10, 10, 10))]);

        const added = p.addElement(new ElementId());

        const t = added.getTransform();
        expect(t.getY() + t.getH()).toBe(MAX_PAGE_HEIGHT);
    });

    it('crée un Element vide, son seul Transform', () => {
        const added = page().addElement(new ElementId());

        expect(added.getComponents()).toEqual({});
    });

    it('borne le nombre d’Elements d’une Page', () => {
        const p = page(Array.from({ length: MAX_ELEMENTS }, () => element()));

        expect(() => p.addElement(new ElementId())).toThrow(TooManyElementsException);
    });
});

describe('Page — opérations sur un Element', () => {
    it('déplace et redimensionne un Element', () => {
        const target = element();
        const p = page([target]);

        p.moveElement(target.getId(), new Transform(10, 20, 30, 40));

        expect(
            p
                .getElements()[0]
                .getTransform()
                .equals(new Transform(10, 20, 30, 40)),
        ).toBe(true);
    });

    it('supprime un Element et le rend', () => {
        const target = element();
        const p = page([element(), target]);

        const removed = p.removeElement(target.getId());

        expect(removed).toBe(target);
        expect(p.getElements()).toHaveLength(1);
    });

    it.each([
        ['déplacer', (p: Page, id: ElementId) => p.moveElement(id, new Transform(0, 0, 1, 1))],
        ['supprimer', (p: Page, id: ElementId) => p.removeElement(id)],
        ['poser un Component', (p: Page, id: ElementId) => p.setComponent(id, 'text', {})],
        ['retirer un Component', (p: Page, id: ElementId) => p.removeComponent(id, 'text')],
    ])('refuse de %s sur un Element inconnu', (_label, operation) => {
        const p = page([element()]);

        expect(() => operation(p, new ElementId())).toThrow(ElementNotFoundException);
    });
});

describe('Page — Components', () => {
    it('normalise un Text à la pose', () => {
        const target = element();
        const p = page([target]);

        p.setComponent(target.getId(), 'text', { html: '<p>Bonjour</p>' });

        expect(target.getComponents()).toEqual({ text: { html: '<p>Bonjour</p>', scale: 'normal' } });
    });

    it('remplace un Component de la même sorte et rend l’ancien', () => {
        const target = element(undefined, { text: { html: '<p>Avant</p>' } });
        const p = page([target]);

        const previous = p.setComponent(target.getId(), 'text', { html: '<p>Après</p>' });

        expect(previous).toEqual({ html: '<p>Avant</p>', scale: 'normal' });
        expect(target.getComponents().text).toEqual({ html: '<p>Après</p>', scale: 'normal' });
    });

    it('refuse une valeur invalide à l’écriture', () => {
        const target = element();

        expect(() => page([target]).setComponent(target.getId(), 'text', { scale: 'énorme' })).toThrow(
            InvalidComponentException,
        );
    });

    it.each(['transform', 'widget', ''])('refuse de poser le kind « %s »', kind => {
        const target = element();

        expect(() => page([target]).setComponent(target.getId(), kind, {})).toThrow(UnknownComponentKindException);
    });

    it('refuse de retirer le Transform', () => {
        const target = element();

        expect(() => page([target]).removeComponent(target.getId(), 'transform')).toThrow(
            UnknownComponentKindException,
        );
    });

    it('retire un Component et rend sa valeur', () => {
        const target = element(undefined, { text: { html: '<p>x</p>' } });
        const p = page([target]);

        const removed = p.removeComponent(target.getId(), 'text');

        expect(removed).toEqual({ html: '<p>x</p>', scale: 'normal' });
        expect(target.getComponents()).toEqual({});
    });

    it('ne fait rien en retirant un Component absent', () => {
        const target = element();

        expect(page([target]).removeComponent(target.getId(), 'text')).toBeNull();
    });
});

describe('Page — contenu', () => {
    it('n’a pas de contenu tant qu’aucun Element n’en porte', () => {
        expect(page().hasContent()).toBe(false);
        expect(page([element()]).hasContent()).toBe(false);
    });

    it('a du contenu dès qu’un Element en porte un', () => {
        expect(page([element(), element(undefined, { text: { html: '<p>x</p>' } })]).hasContent()).toBe(true);
    });
});

describe('Element — lecture tolérante', () => {
    it('ignore un kind inconnu en base', () => {
        const e = element(undefined, { widget: { a: 1 }, text: { html: '<p>x</p>' } });

        expect(Object.keys(e.getComponents())).toEqual(['text']);
    });

    it('répare une valeur invalide en base au lieu de lever', () => {
        const e = element(undefined, { text: { html: 42, scale: 'énorme' } });

        expect(e.getComponents().text).toEqual({ html: '', scale: 'normal' });
    });

    it('ignore une valeur qui n’est pas un objet', () => {
        const e = element(undefined, { text: 'bonjour' });

        expect(e.getComponents()).toEqual({});
    });
});

describe('au plus un contenu', () => {
    const descriptor = (role: 'content' | 'facet'): ComponentDescriptor => ({
        role,
        interactive: false,
        flow: 'visual',
        normalize: () => ({}),
        describe: '',
    });
    const registry = { a: descriptor('content'), b: descriptor('content'), f: descriptor('facet') };

    it('signale le contenu déjà porté quand on en pose un autre', () => {
        expect(contentConflict(['a'], 'b', registry)).toBe('a');
    });

    it('laisse remplacer le même contenu ou poser une facette', () => {
        expect(contentConflict(['a'], 'a', registry)).toBeNull();
        expect(contentConflict(['a'], 'f', registry)).toBeNull();
        expect(contentConflict(['f'], 'b', registry)).toBeNull();
    });
});

describe('Page — ordre d’affichage', () => {
    function ids(p: Page): string[] {
        return p.getElements().map(e => e.getId().getValue());
    }

    it('avance un Element en l’échangeant avec son voisin suivant', () => {
        const [a, b, c] = [element(), element(), element()];
        const p = page([a, b, c]);

        p.reorderElement(a.getId(), 'forward');

        expect(ids(p)).toEqual([b, a, c].map(e => e.getId().getValue()));
    });

    it('recule un Element en l’échangeant avec son voisin précédent', () => {
        const [a, b, c] = [element(), element(), element()];
        const p = page([a, b, c]);

        p.reorderElement(c.getId(), 'backward');

        expect(ids(p)).toEqual([a, c, b].map(e => e.getId().getValue()));
    });

    it('ne fait rien en bout de liste', () => {
        const [a, b] = [element(), element()];
        const p = page([a, b]);

        p.reorderElement(b.getId(), 'forward');
        p.reorderElement(a.getId(), 'backward');

        expect(ids(p)).toEqual([a, b].map(e => e.getId().getValue()));
    });

    it('signale un Element inconnu', () => {
        expect(() => page([element()]).reorderElement(new ElementId(), 'forward')).toThrow(ElementNotFoundException);
    });
});

describe('Page — duplication', () => {
    it('copie les Components dans un nouvel Element décalé, juste au-dessus de l’original', () => {
        const source = element(new Transform(100, 200, 300, 400), { text: { html: '<p>a</p>' } });
        const last = element();
        const p = page([source, last]);
        const id = new ElementId();

        p.duplicateElement(source.getId(), id);

        const elements = p.getElements();
        expect(elements.map(e => e.getId().getValue())).toEqual([
            source.getId().getValue(),
            id.getValue(),
            last.getId().getValue(),
        ]);
        expect(elements[1].getTransform()).toEqual(new Transform(120, 220, 300, 400));
        expect(elements[1].getComponents()).toEqual(source.getComponents());
    });

    it('garde la copie dans la Page quand l’original touche un bord', () => {
        const source = element(new Transform(REFERENCE_WIDTH - 300, MAX_PAGE_HEIGHT - 400, 300, 400));
        const p = page([source]);

        const copy = p.duplicateElement(source.getId(), new ElementId());

        expect(copy.getTransform()).toEqual(source.getTransform());
    });

    it('ne partage pas ses Components avec l’original', () => {
        const source = element(undefined, { text: { html: '<p>a</p>' } });
        const p = page([source]);
        const copy = p.duplicateElement(source.getId(), new ElementId());

        copy.setComponent('text', { html: '<p>b</p>' });

        expect(source.getComponents().text).toMatchObject({ html: '<p>a</p>' });
    });

    it('refuse au-delà du nombre maximal d’Elements', () => {
        const elements = Array.from({ length: MAX_ELEMENTS }, () => element());
        const p = page(elements);

        expect(() => p.duplicateElement(elements[0].getId(), new ElementId())).toThrow(TooManyElementsException);
    });
});
