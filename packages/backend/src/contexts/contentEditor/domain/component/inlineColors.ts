import { safeCssColor } from '../valueObject/color';

const TAG = /<[a-z](?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const STYLE_ATTRIBUTE = /(\sstyle\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi;
const DATA_COLOR_ATTRIBUTE = /\sdata-color\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const COLOR_DECLARATION = /^\s*(color|background-color|background)\s*:(.*)$/i;

export function sanitizeInlineColors(html: string): string {
    return html.replace(TAG, sanitizeTag);
}

function sanitizeTag(tag: string): string {
    return tag
        .replace(STYLE_ATTRIBUTE, (_match, prefix: string, double?: string, single?: string) => {
            const quote = double !== undefined ? '"' : "'";
            return `${prefix}${quote}${sanitizeStyle(double ?? single ?? '')}${quote}`;
        })
        .replace(DATA_COLOR_ATTRIBUTE, (_match, double?: string, single?: string) => {
            const color = safeCssColor(decodeQuotes(double ?? single ?? ''));
            return color === null ? '' : ` data-color="${color}"`;
        });
}

function sanitizeStyle(style: string): string {
    return style
        .split(';')
        .flatMap(declaration => {
            const match = COLOR_DECLARATION.exec(declaration);
            if (!match) return [declaration];
            const color = safeCssColor(decodeQuotes(match[2]));
            return color === null ? [] : [`${match[1].toLowerCase()}: ${color}`];
        })
        .join(';');
}

function decodeQuotes(value: string): string {
    return value.replace(/&quot;|&#39;/g, '');
}
