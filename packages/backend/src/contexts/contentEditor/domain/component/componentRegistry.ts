import { ComponentReader } from './componentReader';
import { InvalidComponentException } from '../exception/invalidComponent';
import { UnknownComponentKindException } from '../exception/unknownComponentKind';
import { sanitizeInlineColors } from './inlineColors';
import {
    DEFAULT_FORM_TITLE,
    DEFAULT_SUBMIT_LABEL,
    DEFAULT_SUCCESS_MESSAGE,
    FORM_FIELD_TYPES,
    MAX_FORM_FIELDS,
    formFields,
} from './contactForm';
import { SiteOrigins } from '../valueObject/siteOrigins';
import { BindingRef, bindingsIn } from './bindings';
import {
    FONT_SIZE_FLOORS,
    FontSizes,
    MAX_FONT_SIZE,
    MAX_LETTER_SPACING,
    MIN_FONT_SIZE,
    MIN_LETTER_SPACING,
    TEXT_FONTS,
    derivedFontSize,
    fontSizesOf,
    readFontSizes,
    reconcileFontSizes,
} from './typography';
import { DerivedScreen } from '../valueObject/screenSize';

export type ComponentValue = Readonly<Record<string, unknown>>;

export type ComponentDescriptor = Readonly<{
    role: 'content' | 'facet';
    interactive: boolean;
    flow: 'text' | 'visual';
    normalize: (component: ComponentReader) => ComponentValue;
    describe: string;
    files?: (value: ComponentValue) => string[];
    projects?: (value: ComponentValue) => string[];
    bindings?: (value: ComponentValue) => BindingRef[];
    withoutFiles?: (value: ComponentValue, missing: ReadonlySet<string>) => ComponentValue | null;
    reconcile?: (previous: ComponentValue, next: ComponentValue) => ComponentValue;
    regenerate?: (value: ComponentValue, screen: DerivedScreen) => ComponentValue;
    heightRatio?: (value: ComponentValue, screen: DerivedScreen) => number;
}>;

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
export const MAX_MEDIA_FILES = 20;
export const MAX_ALT_LENGTH = 300;
export const MAX_BORDER_WIDTH = 32;
export const MAX_RADIUS = 256;

const COLOR = '{ theme: "--color-…" } | { hex: "#rrggbb" } | null';
const URL_SHAPE = 'http(s) URL | /uploads/… | null';

type MediaFile = Readonly<{ url: string | null; alt: string }>;

function filesOf(value: ComponentValue): MediaFile[] {
    return Array.isArray(value.files) ? (value.files as MediaFile[]) : [];
}

function mediaFiles(component: ComponentReader): MediaFile[] {
    const files = component.list('files').map(file => {
        const alt = file.string('alt');
        return {
            url: file.safeUrl('url'),
            alt:
                alt.length > MAX_ALT_LENGTH
                    ? file.invalid('alt', `at most ${MAX_ALT_LENGTH} characters`, alt.slice(0, MAX_ALT_LENGTH))
                    : alt,
        };
    });
    if (files.length > MAX_MEDIA_FILES) {
        return component.invalid('files', `at most ${MAX_MEDIA_FILES} files`, files.slice(0, MAX_MEDIA_FILES));
    }
    return files;
}

export const COMPONENT_REGISTRY = {
    text: {
        role: 'content',
        interactive: false,
        flow: 'text',
        normalize: component => ({
            html: sanitizeInlineColors(component.string('html')),
            font: component.oneOf('font', TEXT_FONTS, 'body'),
            fontSize: readFontSizes(component),
            uppercase: component.boolean('uppercase', false),
            letterSpacing: component.number('letterSpacing', 0, MIN_LETTER_SPACING, MAX_LETTER_SPACING),
            color: component.color('color'),
        }),
        describe:
            `Rich text. { html: string (TipTap HTML), font: ${TEXT_FONTS.join(' | ')}, fontSize: integer ` +
            `${MIN_FONT_SIZE}-${MAX_FONT_SIZE} px for desktop, or { desktop, tablet, mobile } (tablet and mobile ` +
            `follow desktop when omitted or when only desktop changes: scaled to the screen width, at least ` +
            `${FONT_SIZE_FLOORS.tablet} px on tablet and ${FONT_SIZE_FLOORS.mobile} px on mobile, never above desktop), ` +
            `uppercase: ` +
            `boolean, letterSpacing: ${MIN_LETTER_SPACING} to ${MAX_LETTER_SPACING} em, color: ${COLOR} }`,
        bindings: value => (typeof value.html === 'string' ? bindingsIn(value.html) : []),
        reconcile: (previous, next) => ({
            ...next,
            fontSize: reconcileFontSizes(fontSizesOf(previous), fontSizesOf(next)),
        }),
        regenerate: (value, screen) => {
            const sizes: FontSizes = fontSizesOf(value);
            return { ...value, fontSize: { ...sizes, [screen]: derivedFontSize(sizes.desktop, screen) } };
        },
        heightRatio: (value, screen) => {
            const sizes = fontSizesOf(value);
            return (sizes[screen] / sizes.desktop) ** 2;
        },
    },
    media: {
        role: 'content',
        interactive: false,
        flow: 'visual',
        normalize: component => ({
            files: mediaFiles(component),
            fit: component.oneOf('fit', IMAGE_FITS, 'contain'),
            position: component.oneOf('position', IMAGE_POSITIONS, 'center'),
        }),
        describe:
            `One or more images, videos, PDFs or mindmaps, chosen by their file; several files are shown one ` +
            `at a time, with arrows. { files: [{ url: ${URL_SHAPE}, alt: string (at most ${MAX_ALT_LENGTH}) }] ` +
            `(at most ${MAX_MEDIA_FILES}, in display order), fit: ${IMAGE_FITS.join(' | ')}, ` +
            `position: ${IMAGE_POSITIONS.join(' | ')} }`,
        files: value => filesOf(value).flatMap(file => (file.url ? [file.url] : [])),
        withoutFiles: (value, missing) => {
            const files = filesOf(value);
            const kept = files.filter(file => !file.url || !missing.has(file.url));
            if (kept.length === files.length) return value;
            return kept.some(file => file.url) ? { ...value, files: kept } : null;
        },
    },
    code: {
        role: 'content',
        interactive: false,
        flow: 'text',
        normalize: component => ({
            code: component.string('code'),
            language: component.string('language'),
            wrap: component.boolean('wrap', false),
        }),
        describe: 'A code snippet, shown as is. { code: string, language: string (label only), wrap: boolean }',
    },
    embed: {
        role: 'content',
        interactive: true,
        flow: 'visual',
        normalize: component => ({
            url: component.embedUrl('url'),
            title: component.string('title'),
        }),
        describe: 'An external page in a sandboxed frame. { url: https URL of another site | null, title: string }',
    },
    contactForm: {
        role: 'content',
        interactive: true,
        flow: 'text',
        normalize: component => ({
            title: component.string('title', DEFAULT_FORM_TITLE),
            fields: formFields(component),
            submitLabel: component.nonEmptyString('submitLabel', DEFAULT_SUBMIT_LABEL),
            successMessage: component.nonEmptyString('successMessage', DEFAULT_SUCCESS_MESSAGE),
            textColor: component.color('textColor'),
            buttonColor: component.color('buttonColor'),
        }),
        describe:
            `The contact form. { title: string, fields: [{ id: string, label: string, type: ` +
            `${FORM_FIELD_TYPES.join(' | ')}, required: boolean }] (at most ${MAX_FORM_FIELDS}), submitLabel: string, ` +
            `successMessage: string, textColor: ${COLOR}, buttonColor: ${COLOR} }`,
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
        projects: value => (typeof value.projectId === 'string' ? [value.projectId] : []),
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

export function normalizeComponent(
    kind: ComponentKind,
    raw: unknown,
    strict: boolean,
    siteOrigins: SiteOrigins = SiteOrigins.none(),
): ComponentValue | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        if (strict) throw new InvalidComponentException(kind, 'an object');
        return null;
    }
    return COMPONENT_REGISTRY[kind].normalize(
        new ComponentReader(raw as Record<string, unknown>, strict, kind, siteOrigins),
    );
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
