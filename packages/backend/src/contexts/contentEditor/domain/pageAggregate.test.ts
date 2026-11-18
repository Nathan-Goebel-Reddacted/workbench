import { describe, expect, it } from 'vitest';
import { Page } from './pageAggregate.js';
import { PageId } from './valueObject/pageId.js';
import { PageType } from './valueObject/pageType.js';
import { PageRef } from './valueObject/pageRef.js';
import { ElementId } from './valueObject/elementId.js';
import { Transform } from './valueObject/transform.js';
import { Layout } from './valueObject/layout.js';
import { MAX_SCREEN_HEIGHTS, SCREEN_SIZES, ScreenSize, parseScreenSize } from './valueObject/screenSize.js';
import { UnknownScreenSizeException } from './exception/unknownScreenSize.js';
import { InvalidLayoutException } from './exception/invalidLayout.js';
import { Element } from './entity/element.js';
import {
    ComponentDescriptor,
    contentConflict,
    linkConflict,
    MAX_ALT_LENGTH,
    MAX_MEDIA_FILES,
} from './component/componentRegistry.js';
import { ElementNotFoundException } from './exception/elementNotFound.js';
import { InvalidTransformException } from './exception/invalidTransform.js';
import { InvalidComponentException } from './exception/invalidComponent.js';
import { UnknownComponentKindException } from './exception/unknownComponentKind.js';
import { TooManyElementsException } from './exception/tooManyElements.js';
import { LinkOnInteractiveContentException } from './exception/linkOnInteractiveContent.js';
import { ContentAlreadyPresentException } from './exception/contentAlreadyPresent.js';
import { SiteOrigins } from './valueObject/siteOrigins.js';
import { MAX_ELEMENTS } from './pageAggregate.js';

function page(elements: Element[] = []): Page {
    return new Page(new PageId(), PageType.PORTFOLIO, new PageRef(), elements);
}

const REFERENCE_WIDTH = SCREEN_SIZES.desktop;
const MAX_PAGE_HEIGHT = MAX_SCREEN_HEIGHTS.desktop;

function t(x: number, y: number, w: number, h: number, screen: ScreenSize = 'desktop'): Transform {
    return new Transform(screen, x, y, w, h);
}

function layoutOf(desktop: Transform, hidden: Partial<Record<ScreenSize, boolean>> = {}): Layout {
    return Layout.of({
        desktop: { transform: desktop, hidden: hidden.desktop ?? false },
        tablet: { transform: t(16, 0, 736, 100, 'tablet'), hidden: hidden.tablet ?? false },
        mobile: { transform: t(16, 0, 343, 100, 'mobile'), hidden: hidden.mobile ?? false },
    });
}

function element(transform = t(0, 0, 100, 100), components: Record<string, unknown> = {}): Element {
    return Element.rehydrate(new ElementId(), layoutOf(transform), components);
}

describe('Transform', () => {
    it('accepte une boîte entière dans la largeur de référence', () => {
        expect(() => t(0, 0, REFERENCE_WIDTH, 1)).not.toThrow();
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
        expect(() => t(x, y, w, h)).toThrow(InvalidTransformException);
    });
});

describe('Page — placement initial', () => {
    it('centre un nouvel Element sous le plus bas quand rien n’indique la zone visible', () => {
        const p = page([element(t(0, 100, 200, 300))]);

        const added = p.addElement(new ElementId());

        const box = added.transform('desktop');
        expect(box.getX()).toBe((REFERENCE_WIDTH - box.getW()) / 2);
        expect(box.getY()).toBe(400 + 40);
    });

    it('pose un nouvel Element en haut de la zone visible quand elle est indiquée', () => {
        const p = page([element(t(0, 5000, 200, 300))]);

        const added = p.addElement(new ElementId(), 'desktop', 1200);

        expect(added.transform('desktop').getY()).toBe(1240);
    });

    it('ramène un nouvel Element sous la hauteur maximale de la Page', () => {
        const p = page([element(t(0, MAX_PAGE_HEIGHT - 10, 10, 10))]);

        const added = p.addElement(new ElementId());

        const box = added.transform('desktop');
        expect(box.getY() + box.getH()).toBe(MAX_PAGE_HEIGHT);
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

        p.moveElement(target.getId(), t(10, 20, 30, 40));

        expect(
            p
                .getElements()[0]
                .transform('desktop')
                .equals(t(10, 20, 30, 40)),
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
        ['déplacer', (p: Page, id: ElementId) => p.moveElement(id, t(0, 0, 1, 1))],
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

        expect(target.getComponents()).toEqual({
            text: {
                html: '<p>Bonjour</p>',
                font: 'body',
                fontSize: { desktop: 16, tablet: 15, mobile: 14 },
                uppercase: false,
                letterSpacing: 0,
                color: null,
            },
        });
    });

    it('remplace un Component de la même sorte et rend l’ancien', () => {
        const target = element(undefined, { text: { html: '<p>Avant</p>' } });
        const p = page([target]);

        const previous = p.setComponent(target.getId(), 'text', { html: '<p>Après</p>' });

        expect(previous).toEqual({
            html: '<p>Avant</p>',
            font: 'body',
            fontSize: { desktop: 16, tablet: 15, mobile: 14 },
            uppercase: false,
            letterSpacing: 0,
            color: null,
        });
        expect(target.getComponents().text).toEqual({
            html: '<p>Après</p>',
            font: 'body',
            fontSize: { desktop: 16, tablet: 15, mobile: 14 },
            uppercase: false,
            letterSpacing: 0,
            color: null,
        });
    });

    it('refuse une valeur invalide à l’écriture', () => {
        const target = element();

        expect(() => page([target]).setComponent(target.getId(), 'text', { font: 'énorme' })).toThrow(
            InvalidComponentException,
        );
    });

    it.each(['transform', 'widget', '', 'projectCard', 'linkList', 'carousel'])(
        'refuse de poser le kind « %s »',
        kind => {
            const target = element();

            expect(() => page([target]).setComponent(target.getId(), kind, {})).toThrow(UnknownComponentKindException);
        },
    );

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

        expect(removed).toEqual({
            html: '<p>x</p>',
            font: 'body',
            fontSize: { desktop: 16, tablet: 15, mobile: 14 },
            uppercase: false,
            letterSpacing: 0,
            color: null,
        });
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

    it.each(['projectCard', 'linkList', 'carousel'])('garde l’Element d’un %s retiré, sans ce contenu', kind => {
        const alone = element(undefined, { [kind]: {} });
        const withSurface = element(undefined, { [kind]: {}, surface: { radius: 8 } });

        expect(alone.getComponents()).toEqual({});
        expect(Object.keys(withSurface.getComponents())).toEqual(['surface']);
    });

    it('répare une valeur invalide en base au lieu de lever', () => {
        const e = element(undefined, { text: { html: 42, font: 'énorme' } });

        expect(e.getComponents().text).toEqual({
            html: '',
            font: 'body',
            fontSize: { desktop: 16, tablet: 15, mobile: 14 },
            uppercase: false,
            letterSpacing: 0,
            color: null,
        });
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
        const source = element(t(100, 200, 300, 400), { text: { html: '<p>a</p>' } });
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
        expect(elements[1].transform('desktop')).toEqual(t(120, 220, 300, 400));
        expect(elements[1].getComponents()).toEqual(source.getComponents());
    });

    it('garde la copie dans la Page quand l’original touche un bord', () => {
        const source = element(t(REFERENCE_WIDTH - 300, MAX_PAGE_HEIGHT - 400, 300, 400));
        const p = page([source]);

        const copy = p.duplicateElement(source.getId(), new ElementId());

        expect(copy.transform('desktop')).toEqual(source.transform('desktop'));
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

describe('Surface', () => {
    it('normalise une Surface avec ses valeurs par défaut', () => {
        const target = element();

        target.setComponent('surface', { background: { theme: '--color-surface' } });

        expect(target.getComponents().surface).toEqual({
            background: { theme: '--color-surface' },
            borderWidth: 0,
            borderColor: null,
            radius: 0,
        });
    });

    it('cohabite avec un contenu sans en être un', () => {
        const target = element();

        target.setComponent('surface', {});
        expect(target.hasContent()).toBe(false);

        target.setComponent('text', { html: '<p>a</p>' });
        expect(target.hasContent()).toBe(true);
    });

    it.each([
        [{ radius: 257 }],
        [{ radius: 1.5 }],
        [{ borderWidth: 33 }],
        [{ background: 'red' }],
        [{ borderColor: { hex: 'url(x)' } }],
    ])('refuse %j à l’écriture', raw => {
        expect(() => element().setComponent('surface', raw)).toThrow(InvalidComponentException);
    });

    it('répare en lecture une Surface invalide en base', () => {
        const target = element(undefined, { surface: { radius: 999, background: 'red', borderWidth: 2.4 } });

        expect(target.getComponents().surface).toEqual({
            background: null,
            borderWidth: 2,
            borderColor: null,
            radius: 256,
        });
    });
});

describe('Text — couleurs', () => {
    it('porte sa couleur de base et assainit les couleurs inline', () => {
        const target = element();

        target.setComponent('text', {
            html: '<span style="color: url(x)">a</span>',
            color: { hex: '#123456' },
        });

        expect(target.getComponents().text).toEqual({
            html: '<span style="">a</span>',
            font: 'body',
            fontSize: { desktop: 16, tablet: 15, mobile: 14 },
            uppercase: false,
            letterSpacing: 0,
            color: { hex: '#123456' },
        });
    });
});

describe('Link', () => {
    it('pose un Link vide, inerte', () => {
        const target = element();

        target.setComponent('link', {});

        expect(target.getComponents().link).toEqual({ url: null, projectId: null, newTab: false });
    });

    it('vise une URL sûre ou un projet', () => {
        const target = element();

        target.setComponent('link', { url: 'https://example.com', newTab: true });
        expect(target.getComponents().link).toEqual({ url: 'https://example.com/', projectId: null, newTab: true });

        target.setComponent('link', { projectId: '11111111-1111-4111-8111-111111111111' });
        expect(target.getComponents().link).toMatchObject({
            url: null,
            projectId: '11111111-1111-4111-8111-111111111111',
        });
    });

    it.each(['/', '/projects', '/cv'])('vise la page du site %s', url => {
        const target = element();

        target.setComponent('link', { url });

        expect(target.getComponents().link).toEqual({ url, projectId: null, newTab: false });
    });

    it.each([
        [{ url: 'javascript:alert(1)' }],
        [{ url: ' JAVASCRIPT:alert(1)' }],
        [{ url: '/admin' }],
        [{ projectId: 'abc' }],
        [{ url: 'https://example.com', projectId: '11111111-1111-4111-8111-111111111111' }],
    ])('refuse %j', raw => {
        expect(() => element().setComponent('link', raw)).toThrow(InvalidComponentException);
    });

    it('neutralise en lecture une URL dangereuse déjà en base', () => {
        const target = element(undefined, { link: { url: 'javascript:alert(1)', newTab: true } });

        expect(target.getComponents().link).toEqual({ url: null, projectId: null, newTab: true });
    });
});

describe('Link sur un contenu interactif', () => {
    const descriptor = (role: 'content' | 'facet', interactive = false): ComponentDescriptor => ({
        role,
        interactive,
        flow: 'visual',
        normalize: () => ({}),
        describe: '',
    });
    const registry = {
        form: descriptor('content', true),
        text: descriptor('content'),
        link: descriptor('facet'),
        surface: descriptor('facet'),
    };

    it('refuse le Link posé sur un contenu interactif', () => {
        expect(linkConflict(['form'], 'link', registry, 'link')).toBe('form');
    });

    it('refuse le contenu interactif posé sous un Link', () => {
        expect(linkConflict(['link', 'surface'], 'form', registry, 'link')).toBe('form');
    });

    it('laisse un Link sur un contenu passif et une facette à côté', () => {
        expect(linkConflict(['text'], 'link', registry, 'link')).toBeNull();
        expect(linkConflict(['link'], 'text', registry, 'link')).toBeNull();
        expect(linkConflict(['link'], 'surface', registry, 'link')).toBeNull();
    });
});

describe('Media', () => {
    it('normalise un Media vide et un Media posé sur plusieurs fichiers, dans leur ordre', () => {
        const target = element();

        target.setComponent('media', {});
        expect(target.getComponents().media).toEqual({ files: [], fit: 'contain', position: 'center' });

        target.setComponent('media', {
            files: [{ url: '/uploads/b.png', alt: 'B' }, { url: '/uploads/a.png' }],
            fit: 'cover',
            position: 'top',
        });
        expect(target.getComponents().media).toEqual({
            files: [
                { url: '/uploads/b.png', alt: 'B' },
                { url: '/uploads/a.png', alt: '' },
            ],
            fit: 'cover',
            position: 'top',
        });
    });

    it.each([
        [{ files: [{ url: 'javascript:alert(1)' }] }],
        [{ files: [{ url: 'data:image/png;base64,x' }] }],
        [{ files: [{ url: '/uploads/../x' }] }],
        [{ files: [{ url: '/cv' }] }],
        [{ files: '/uploads/a.png' }],
        [{ files: [{ url: '/uploads/a.png', alt: 'x'.repeat(MAX_ALT_LENGTH + 1) }] }],
        [{ files: Array.from({ length: MAX_MEDIA_FILES + 1 }, () => ({ url: '/uploads/a.png' })) }],
        [{ fit: 'stretch' }],
    ])('refuse le Media %j', raw => {
        expect(() => element().setComponent('media', raw)).toThrow(InvalidComponentException);
    });

    it('ignore un réglage étranger au Media', () => {
        const target = element();

        target.setComponent('media', { radius: 4 });

        expect(target.getComponents().media).not.toHaveProperty('radius');
    });

    it('borne en lecture tolérante un Media trop long au lieu de lever', () => {
        const files = Array.from({ length: MAX_MEDIA_FILES + 3 }, () => ({
            url: '/uploads/a.png',
            alt: 'x'.repeat(400),
        }));

        const media = element(undefined, { media: { files } }).getComponents().media as { files: { alt: string }[] };

        expect(media.files).toHaveLength(MAX_MEDIA_FILES);
        expect(media.files[0].alt).toHaveLength(MAX_ALT_LENGTH);
    });

    it('refuse un deuxième contenu à côté d’un Media', () => {
        const target = element();
        target.setComponent('media', {});

        expect(() => target.setComponent('code', {})).toThrow(ContentAlreadyPresentException);
    });
});

describe('Code et Embed', () => {
    const site = new SiteOrigins(['https://goebel.test', 'https://admin.goebel.test']);

    it('normalise un Code', () => {
        const target = element();

        target.setComponent('code', { code: 'const a = 1', language: 'ts' });

        expect(target.getComponents().code).toEqual({ code: 'const a = 1', language: 'ts', wrap: false });
    });

    it('intègre une page https d’un autre site', () => {
        const target = element();

        target.setComponent('embed', { url: 'https://www.youtube.com/embed/x', title: 'Vidéo' }, site);

        expect(target.getComponents().embed).toEqual({ url: 'https://www.youtube.com/embed/x', title: 'Vidéo' });
    });

    it.each([
        'http://example.com',
        'https://goebel.test/projects',
        'https://admin.goebel.test',
        '/uploads/a.pdf',
        'javascript:alert(1)',
    ])('refuse d’intégrer %s', url => {
        expect(() => element().setComponent('embed', { url }, site)).toThrow(InvalidComponentException);
    });

    it.each(['embed'] as const)('refuse un Link sur un %s, dans les deux ordres', kind => {
        const contentFirst = element();
        contentFirst.setComponent(kind, {});
        expect(() => contentFirst.setComponent('link', {})).toThrow(LinkOnInteractiveContentException);

        const linkFirst = element();
        linkFirst.setComponent('link', {});
        expect(() => linkFirst.setComponent(kind, {})).toThrow(LinkOnInteractiveContentException);
    });

    it('accepte un Link sur un Code', () => {
        const target = element();
        target.setComponent('code', {});

        expect(() => target.setComponent('link', {})).not.toThrow();
    });
});

describe('ContactForm', () => {
    it('pose un ContactForm avec ses champs par défaut et ses couleurs', () => {
        const target = element();

        target.setComponent('contactForm', { buttonColor: { theme: '--color-primary' } });

        expect(target.getComponents().contactForm).toMatchObject({
            title: 'Me contacter',
            fields: [{ id: 'name' }, { id: 'email' }, { id: 'message' }],
            submitLabel: 'Envoyer',
            textColor: null,
            buttonColor: { theme: '--color-primary' },
        });
    });

    it.each(['contactForm'] as const)('refuse un Link sur un %s, dans les deux ordres', kind => {
        const contentFirst = element();
        contentFirst.setComponent(kind, {});
        expect(() => contentFirst.setComponent('link', {})).toThrow(LinkOnInteractiveContentException);

        const linkFirst = element();
        linkFirst.setComponent('link', {});
        expect(() => linkFirst.setComponent(kind, {})).toThrow(LinkOnInteractiveContentException);
    });
});

describe('Disposition par taille d’écran', () => {
    it.each([
        ['mobile', 16, 0, 360, 10],
        ['tablet', 0, 0, 769, 10],
        ['tablet', 0, MAX_SCREEN_HEIGHTS.tablet - 5, 10, 10],
    ] as const)('borne le Transform %s par sa taille (x=%s y=%s w=%s h=%s)', (screen, x, y, w, h) => {
        expect(() => t(x, y, w, h, screen)).toThrow(InvalidTransformException);
    });

    it('accepte sur mobile une hauteur que le desktop refuse', () => {
        expect(() => t(0, 30000, 10, 10, 'mobile')).not.toThrow();
        expect(() => t(0, 30000, 10, 10)).toThrow(InvalidTransformException);
    });

    it('refuse une taille inconnue et une disposition incomplète ou mal rangée', () => {
        expect(() => parseScreenSize('watch')).toThrow(UnknownScreenSizeException);
        const desktop = { transform: t(0, 0, 10, 10), hidden: false };
        expect(() =>
            Layout.of({ desktop, tablet: desktop, mobile: { transform: t(0, 0, 10, 10, 'mobile'), hidden: false } }),
        ).toThrow(InvalidLayoutException);
    });

    it('crée un Element complet, posé en bas de la tablette et du mobile, sans toucher les autres', () => {
        const other = element();
        other.moveTo(t(16, 400, 343, 200, 'mobile'));
        const p = page([other]);

        const added = p.addElement(new ElementId());

        expect(added.transform('mobile')).toMatchObject({ x: 16, y: 600 + 24, w: 343 });
        expect(added.transform('tablet')).toMatchObject({ x: 16, y: 100 + 24, w: 736 });
        expect(other.transform('mobile').equals(t(16, 400, 343, 200, 'mobile'))).toBe(true);
    });

    it('crée un Element depuis le mobile au haut visible, et garde sa hauteur mobile au premier contenu', () => {
        const p = page([element(t(0, 0, 720, 360))]);

        const added = p.addElement(new ElementId(), 'mobile', 600);
        const mobile = added.transform('mobile');
        p.setComponent(added.getId(), 'media', {});

        expect(mobile).toMatchObject({ x: 16, y: 640, w: 343 });
        expect(added.transform('mobile').equals(mobile)).toBe(true);
        expect(added.transform('tablet').getH()).toBe(Math.round((736 * 160) / 480));
        expect(added.transform('desktop').getY()).toBe(360 + 40);
    });

    it('ignore un Element masqué pour trouver le bas d’une taille', () => {
        const hidden = element();
        hidden.moveTo(t(16, 5000, 343, 100, 'mobile'));
        hidden.hide('mobile', true);

        const added = page([hidden]).addElement(new ElementId());

        expect(added.transform('mobile').getY()).toBe(24);
    });

    it('ajuste la seule hauteur tablette et mobile à la pose du premier contenu', () => {
        const target = element(t(0, 0, 720, 360));
        target.moveTo(t(40, 80, 300, 50, 'mobile'));
        const p = page([target]);

        p.setComponent(target.getId(), 'media', {});

        expect(target.transform('mobile')).toMatchObject({ x: 40, y: 80, w: 300, h: 150 });
        expect(target.transform('tablet').getH()).toBe(368);
        expect(target.transform('desktop').equals(t(0, 0, 720, 360))).toBe(true);
    });

    it('fait refluer un Text selon le rapport de ses polices, et ne recalcule plus au contenu suivant', () => {
        const target = element(t(0, 0, 686, 100));
        const p = page([target]);

        p.setComponent(target.getId(), 'text', { fontSize: 28 });
        expect(target.transform('mobile').getH()).toBe(Math.round(((100 * 686) / 343) * (14 / 28) ** 2));

        target.moveTo(t(16, 0, 343, 64, 'mobile'));
        p.setComponent(target.getId(), 'text', { html: '<p>x</p>' });
        expect(target.transform('mobile').getH()).toBe(64);
    });

    it('régénère une taille depuis les rangées de lecture du desktop', () => {
        const right = element(t(800, 0, 400, 200));
        const left = element(t(0, 20, 400, 200));
        const below = element(t(0, 400, 1440, 100));
        const hidden = element(t(0, 0, 100, 100));
        hidden.hide('desktop', true);
        const p = page([right, hidden, below, left]);

        p.regenerateLayout('mobile');

        const order = [left, right, below, hidden].map(e => e.transform('mobile').getY());
        expect(order).toEqual([...order].sort((a, b) => a - b));
        expect(left.transform('mobile')).toMatchObject({ x: 16, y: 24, w: 343, h: 172 });
        expect(hidden.getLayout().isHidden('mobile')).toBe(true);
        expect(left.transform('tablet').getW()).toBe(736);
    });

    it('régénère une Page de 200 Elements sans dépasser la hauteur maximale', () => {
        const elements = Array.from({ length: MAX_ELEMENTS }, (_, i) =>
            element(t(0, i * 90, 1440, 2000 > MAX_PAGE_HEIGHT - i * 90 ? 80 : 2000), { text: {} }),
        );
        const p = page(elements);

        expect(() => p.regenerateLayout('mobile')).not.toThrow();
        for (const e of elements) expect(e.transform('mobile').bottom()).toBeLessThanOrEqual(MAX_SCREEN_HEIGHTS.mobile);
    });

    it('masque par taille ; masqué partout, l’Element ne compte plus comme contenu', () => {
        const target = element(undefined, { text: {} });
        const p = page([target]);

        for (const screen of ['desktop', 'tablet'] as const) p.hideElement(target.getId(), screen, true);
        expect(p.hasContent()).toBe(true);

        p.hideElement(target.getId(), 'mobile', true);
        expect(p.hasContent()).toBe(false);

        p.hideElement(target.getId(), 'tablet', false);
        expect(p.hasContent()).toBe(true);
    });

    it('duplique chaque placement avec son décalage, borné à sa taille', () => {
        const source = element(t(1400, 0, 40, 40));
        source.moveTo(t(16, 0, 343, 40, 'mobile'));
        const p = page([source]);

        const copy = p.duplicateElement(source.getId(), new ElementId());

        expect(copy.transform('desktop')).toMatchObject({ x: 1400, y: 20 });
        expect(copy.transform('mobile')).toMatchObject({ x: 32, y: 20, w: 343 });
    });

    it('supprime un Element sans déplacer les autres', () => {
        const kept = element();
        kept.moveTo(t(16, 500, 343, 40, 'mobile'));
        const removed = element();
        const p = page([removed, kept]);

        p.removeElement(removed.getId());

        expect(kept.transform('mobile').equals(t(16, 500, 343, 40, 'mobile'))).toBe(true);
    });
});

describe('Typographie du Text', () => {
    const sizesOf = (e: Element) => (e.getComponents().text as { fontSize: Record<ScreenSize, number> }).fontSize;

    it('calcule tablette et mobile depuis le desktop : un titre de 76 px, un corps ramené au plancher', () => {
        const title = element();
        title.setComponent('text', { fontSize: 76 });
        const body = element();
        body.setComponent('text', { fontSize: 18 });

        expect(sizesOf(title)).toEqual({ desktop: 76, tablet: 41, mobile: 20 });
        expect(sizesOf(body)).toEqual({ desktop: 18, tablet: 15, mobile: 14 });
    });

    it('ne monte jamais une taille dérivée au-dessus du desktop', () => {
        const caption = element();
        caption.setComponent('text', { fontSize: 12 });

        expect(sizesOf(caption)).toEqual({ desktop: 12, tablet: 12, mobile: 12 });
    });

    it('recalcule tablette et mobile quand le desktop change, sauf celle que la même écriture retouche', () => {
        const target = element();
        target.setComponent('text', { fontSize: { desktop: 76, tablet: 48, mobile: 30 } });
        expect(sizesOf(target)).toEqual({ desktop: 76, tablet: 48, mobile: 30 });

        target.setComponent('text', { fontSize: { desktop: 76, tablet: 48, mobile: 24 } });
        expect(sizesOf(target)).toEqual({ desktop: 76, tablet: 48, mobile: 24 });

        target.setComponent('text', { fontSize: { desktop: 64, tablet: 48, mobile: 22 } });
        expect(sizesOf(target)).toEqual({ desktop: 64, tablet: 34, mobile: 22 });
    });

    it('recalcule la taille de police d’une taille d’écran régénérée', () => {
        const target = element(t(0, 0, 720, 100), {
            text: { fontSize: { desktop: 76, tablet: 60, mobile: 40 } },
        });

        page([target]).regenerateLayout('mobile');

        expect(sizesOf(target)).toEqual({ desktop: 76, tablet: 60, mobile: 20 });
    });

    it('pose la police, les capitales et l’espacement, et refuse les valeurs hors bornes', () => {
        const target = element();
        target.setComponent('text', { font: 'heading', uppercase: true, letterSpacing: 0.2 });
        expect(target.getComponents().text).toMatchObject({ font: 'heading', uppercase: true, letterSpacing: 0.2 });

        for (const raw of [{ font: 'serif' }, { fontSize: 7 }, { fontSize: { desktop: 200 } }, { letterSpacing: 1 }]) {
            expect(() => element().setComponent('text', raw)).toThrow(InvalidComponentException);
        }
    });
});
