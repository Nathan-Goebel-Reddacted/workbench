import { ComponentReader } from './componentReader';
import { InvalidComponentException } from '../exception/invalidComponent';
import { UnknownComponentKindException } from '../exception/unknownComponentKind';
import { sanitizeInlineColors } from './inlineColors';

export type ComponentValue = Readonly<Record<string, unknown>>;

export type ComponentDescriptor = Readonly<{
    role: 'content' | 'facet';
    interactive: boolean;
    flow: 'text' | 'visual';
    normalize: (component: ComponentReader) => ComponentValue;
    describe: string;
    files?: (value: ComponentValue) => string[];
    withoutFiles?: (value: ComponentValue, missing: ReadonlySet<string>) => ComponentValue | null;
}>;

export const TEXT_SCALES = ['normal', 'large', 'display'] as const;
export const IMAGE_FITS = ['contain', 'cover', 'fill'] as const;
export const IMAGE_POSITIONS = [
    'top left',
    'top',
    'top right',
    'left',
    'center',
    'right',
    'bottom left',
    'bottom',
    'bottom right',
] as const;
export const MAX_CAROUSEL_ITEMS = 50;
export const MAX_BORDER_WIDTH = 32;
export const MAX_RADIUS = 256;

const COLOR = '{ theme: "--color-…" } | { hex: "#rrggbb" } | null';
const URL_SHAPE = 'http(s) URL | /uploads/… | null';

type CarouselItem = Readonly<{ url: string | null; caption: string }>;

function urlOf(value: ComponentValue): string[] {
    return typeof value.url === 'string' ? [value.url] : [];
}

function itemsOf(value: ComponentValue): CarouselItem[] {
    return Array.isArray(value.items) ? (value.items as CarouselItem[]) : [];
}

export const COMPONENT_REGISTRY = {
    text: {
        role: 'content',
        interactive: false,
        flow: 'text',
        normalize: component => ({
            html: sanitizeInlineColors(component.string('html')),
            scale: component.oneOf('scale', TEXT_SCALES, 'normal'),
            color: component.color('color'),
        }),
        describe: `Rich text. { html: string (TipTap HTML), scale: ${TEXT_SCALES.join(' | ')}, color: ${COLOR} }`,
    },
    media: {
        role: 'content',
        interactive: false,
        flow: 'visual',
        normalize: component => ({
            url: component.safeUrl('url'),
            alt: component.string('alt'),
            fit: component.oneOf('fit', IMAGE_FITS, 'contain'),
            position: component.oneOf('position', IMAGE_POSITIONS, 'center'),
        }),
        describe:
            `An image, a video, a PDF or a mindmap, chosen by its file. { url: ${URL_SHAPE}, alt: string, ` +
            `fit: ${IMAGE_FITS.join(' | ')}, position: ${IMAGE_POSITIONS.join(' | ')} }`,
        files: urlOf,
        withoutFiles: (value, missing) => (urlOf(value).some(url => missing.has(url)) ? null : value),
    },
    carousel: {
        role: 'content',
        interactive: false,
        flow: 'visual',
        normalize: component => {
            const items = component.list('items').map(item => ({
                url: item.safeUrl('url'),
                caption: item.string('caption'),
            }));
            if (items.length > MAX_CAROUSEL_ITEMS) {
                return component.invalid('items', `at most ${MAX_CAROUSEL_ITEMS} items`, {
                    items: items.slice(0, MAX_CAROUSEL_ITEMS),
                });
            }
            return { items };
        },
        describe: `A row of captioned images. { items: [{ url: ${URL_SHAPE}, caption: string }] (at most ${MAX_CAROUSEL_ITEMS}) }`,
        files: value => itemsOf(value).flatMap(item => (item.url ? [item.url] : [])),
        withoutFiles: (value, missing) => {
            const items = itemsOf(value);
            const kept = items.filter(item => !item.url || !missing.has(item.url));
            if (kept.length === items.length) return value;
            return kept.some(item => item.url) ? { ...value, items: kept } : null;
        },
    },
    surface: {
        role: 'facet',
        interactive: false,
        flow: 'visual',
        normalize: component => ({
            background: component.color('background'),
            borderWidth: component.integer('borderWidth', 0, 0, MAX_BORDER_WIDTH),
            borderColor: component.color('borderColor'),
            radius: component.integer('radius', 0, 0, MAX_RADIUS),
        }),
        describe:
            `Box styling around the content. { background: ${COLOR}, borderWidth: 0-${MAX_BORDER_WIDTH}, ` +
            `borderColor: ${COLOR}, radius: 0-${MAX_RADIUS} }`,
    },
    link: {
        role: 'facet',
        interactive: false,
        flow: 'visual',
        normalize: component => {
            const url = component.safeUrl('url');
            const projectId = component.uuid('projectId');
            const newTab = component.boolean('newTab', false);
            if (url !== null && projectId !== null) {
                return component.invalid('projectId', 'absent when an url is set', { url, projectId: null, newTab });
            }
            return { url, projectId, newTab };
        },
        describe:
            'Makes the whole element clickable. { url: http(s) URL | /uploads/… | /projects/<id> | null, ' +
            'projectId: project id | null (follows the project destination), newTab: boolean } — at most one ' +
            'target; refused on an interactive content.',
    },
} as const satisfies Record<string, ComponentDescriptor>;

export const LINK_KIND = 'link';

export type ComponentKind = keyof typeof COMPONENT_REGISTRY;

export const COMPONENT_KINDS = Object.keys(COMPONENT_REGISTRY) as ComponentKind[];

export function isComponentKind(kind: string): kind is ComponentKind {
    return Object.hasOwn(COMPONENT_REGISTRY, kind);
}

export function parseComponentKind(kind: string): ComponentKind {
    if (!isComponentKind(kind)) throw new UnknownComponentKindException(kind, COMPONENT_KINDS);
    return kind;
}

export function normalizeComponent(kind: ComponentKind, raw: unknown, strict: boolean): ComponentValue | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        if (strict) throw new InvalidComponentException(kind, 'an object');
        return null;
    }
    return COMPONENT_REGISTRY[kind].normalize(new ComponentReader(raw as Record<string, unknown>, strict, kind));
}

export function linkConflict<K extends string>(
    present: readonly K[],
    incoming: K,
    registry: Readonly<Record<K, ComponentDescriptor>>,
    link: K,
): K | null {
    const interactive = (kind: K) => registry[kind].role === 'content' && registry[kind].interactive;
    if (incoming === link) return present.find(interactive) ?? null;
    if (interactive(incoming) && present.includes(link)) return incoming;
    return null;
}

export function contentConflict<K extends string>(
    present: readonly K[],
    incoming: K,
    registry: Readonly<Record<K, ComponentDescriptor>>,
): K | null {
    if (registry[incoming].role !== 'content') return null;
    return present.find(kind => kind !== incoming && registry[kind].role === 'content') ?? null;
}
