import { randomUUID } from 'node:crypto';
import { SectionType } from '../sectionType';
import { ContentReader } from './contentReader';

type Normalize = (content: ContentReader) => Record<string, unknown>;

const MAX_RADIUS = 64;

const IMAGE_FITS = ['contain', 'cover', 'fill'] as const;
const IMAGE_POSITIONS = [
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
const LINK_AREA_TARGETS = ['url', 'project'] as const;
const LINK_STYLES = ['link', 'solid', 'outline'] as const;
const FORM_FIELD_TYPES = ['text', 'email', 'textarea'] as const;

export const DEFAULT_FORM_FIELDS = [
    { id: 'name', label: 'Nom', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'message', label: 'Message', type: 'textarea', required: true },
] as const;

export const DEFAULT_FORM_TITLE = 'Me contacter';
export const DEFAULT_SUBMIT_LABEL = 'Envoyer';
export const DEFAULT_SUCCESS_MESSAGE = 'Merci, votre message a bien été envoyé.';

export function isEmbeddableUrl(url: string): boolean {
    try {
        const { protocol } = new URL(url);
        return protocol === 'https:' || protocol === 'http:';
    } catch {
        return false;
    }
}

function embedUrl(content: ContentReader): string {
    const url = content.string('url');
    if (url === '' || isEmbeddableUrl(url)) return url;
    return content.invalid('url', 'an http(s) URL', '');
}

function formFields(content: ContentReader): Record<string, unknown>[] {
    const fields = content.list('fields').map((field, index) => ({
        id: field.nonEmptyString('id', content.isStrict() ? randomUUID() : `field-${index}`),
        label: field.string('label'),
        type: field.oneOf('type', FORM_FIELD_TYPES, 'text'),
        required: field.boolean('required', false),
    }));
    return fields.length > 0 ? fields : DEFAULT_FORM_FIELDS.map(field => ({ ...field }));
}

export const SECTION_CONTENT_SCHEMAS: Record<SectionType, Normalize> = {
    [SectionType.TEXT]: content => ({
        html: content.has('html') ? content.string('html') : content.string('text'),
    }),
    [SectionType.DOCUMENT]: content => ({
        url: content.string('url'),
        alt: content.string('alt'),
        fit: content.oneOf('fit', IMAGE_FITS, 'contain'),
        position: content.oneOf('position', IMAGE_POSITIONS, 'center'),
        radius: content.number('radius', 4, 0, MAX_RADIUS),
    }),
    [SectionType.CODE]: content => ({
        code: content.string('code'),
        language: content.string('language'),
        wrap: content.boolean('wrap', false),
    }),
    [SectionType.LINK]: content => ({
        externalLinks: content.list('externalLinks').map(link => ({
            url: link.string('url'),
            displayText: link.string('displayText'),
            logo: link.string('logo'),
            style: link.oneOf('style', LINK_STYLES, 'link'),
            newTab: link.boolean('newTab', true),
        })),
    }),
    [SectionType.EMBED]: content => ({
        url: embedUrl(content),
        title: content.string('title'),
        radius: content.number('radius', 4, 0, MAX_RADIUS),
    }),
    [SectionType.CAROUSEL]: content => ({
        items: content.list('items').map(item => ({
            url: item.string('url'),
            caption: item.string('caption'),
        })),
    }),
    [SectionType.PROJECT_CARD]: content => ({
        projectId: content.string('projectId'),
    }),
    [SectionType.BACKGROUND]: content => ({
        radius: content.number('radius', 8, 0, MAX_RADIUS),
        border: content.boolean('border', false),
        dark: content.boolean('dark', false),
    }),
    [SectionType.CONTACT_FORM]: content => ({
        title: content.string('title', DEFAULT_FORM_TITLE),
        fields: formFields(content),
        submitLabel: content.nonEmptyString('submitLabel', DEFAULT_SUBMIT_LABEL),
        successMessage: content.nonEmptyString('successMessage', DEFAULT_SUCCESS_MESSAGE),
    }),
    [SectionType.LINK_AREA]: content => ({
        target: content.oneOf('target', LINK_AREA_TARGETS, 'url'),
        url: content.string('url'),
        projectId: content.string('projectId'),
        newTab: content.boolean('newTab', true),
    }),
};
