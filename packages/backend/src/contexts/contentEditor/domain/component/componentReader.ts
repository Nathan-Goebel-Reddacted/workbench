import { InvalidComponentException } from '../exception/invalidComponent';
import { ColorValue, parseColor } from '../valueObject/color';
import { SITE_PAGES, parseLinkUrl, parseSafeUrl } from '../valueObject/safeUrl';
import { SiteOrigins } from '../valueObject/siteOrigins';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Raw = Record<string, unknown>;

export class ComponentReader {
    constructor(
        private readonly raw: Raw,
        private readonly strict: boolean,
        private readonly path: string,
        private readonly siteOrigins: SiteOrigins = SiteOrigins.none(),
    ) {}

    isStrict(): boolean {
        return this.strict;
    }

    has(key: string): boolean {
        return this.raw[key] !== undefined && this.raw[key] !== null;
    }

    isNumber(key: string): boolean {
        return typeof this.raw[key] === 'number';
    }

    child(key: string): ComponentReader | null {
        const value = this.raw[key];
        if (value === undefined || value === null) return null;
        if (typeof value === 'object' && !Array.isArray(value)) {
            return new ComponentReader(value as Raw, this.strict, this.field(key), this.siteOrigins);
        }
        return this.invalid(key, 'an object', null);
    }

    string(key: string, fallback = ''): string {
        const value = this.raw[key];
        if (value === undefined || value === null) return fallback;
        if (typeof value === 'string') return value;
        return this.invalid(key, 'a string', fallback);
    }

    nonEmptyString(key: string, fallback: string): string {
        const value = this.string(key, fallback);
        return value === '' ? fallback : value;
    }

    boolean(key: string, fallback: boolean): boolean {
        const value = this.raw[key];
        if (value === undefined || value === null) return fallback;
        if (typeof value === 'boolean') return value;
        return this.invalid(key, 'a boolean', fallback);
    }

    number(key: string, fallback: number, min: number, max: number): number {
        const value = this.raw[key];
        if (value === undefined || value === null) return fallback;
        if (this.strict) {
            if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
                throw new InvalidComponentException(this.field(key), `a number between ${min} and ${max}`);
            }
            return value;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
    }

    integer(key: string, fallback: number, min: number, max: number): number {
        const value = this.number(key, fallback, min, max);
        if (Number.isInteger(value)) return value;
        if (this.strict) throw new InvalidComponentException(this.field(key), `an integer between ${min} and ${max}`);
        return Math.round(value);
    }

    color(key: string): ColorValue | null {
        const value = this.raw[key];
        if (value === undefined || value === null) return null;
        return parseColor(value) ?? this.invalid(key, 'a colour { theme: "--color-…" } or { hex: "#rrggbb" }', null);
    }

    safeUrl(key: string): string | null {
        const value = this.string(key);
        if (value === '') return null;
        return parseSafeUrl(value) ?? this.invalid(key, 'an http(s) URL, an /uploads/ path or a project page', null);
    }

    linkUrl(key: string): string | null {
        const value = this.string(key);
        if (value === '') return null;
        return (
            parseLinkUrl(value) ??
            this.invalid(
                key,
                `an http(s) URL, an /uploads/ path, a project page or a site page (${SITE_PAGES.join(', ')})`,
                null,
            )
        );
    }

    embedUrl(key: string): string | null {
        const url = this.safeUrl(key);
        if (url === null) return null;
        if (url.startsWith('https://') && !this.siteOrigins.contains(url)) return url;
        return this.invalid(key, 'an https URL from another site', null);
    }

    uuid(key: string): string | null {
        const value = this.string(key);
        if (value === '') return null;
        return UUID.test(value) ? value.toLowerCase() : this.invalid(key, 'an id', null);
    }

    oneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
        const value = this.raw[key];
        if (value === undefined || value === null) return fallback;
        if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T;
        return this.invalid(key, `one of ${allowed.join(', ')}`, fallback);
    }

    list(key: string): ComponentReader[] {
        const value = this.raw[key];
        if (value === undefined || value === null) return [];
        if (!Array.isArray(value)) return this.invalid(key, 'a list', []);
        return value.flatMap((item, index) => {
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                return [
                    new ComponentReader(item as Raw, this.strict, `${this.field(key)}[${index}]`, this.siteOrigins),
                ];
            }
            return this.invalid(`${key}[${index}]`, 'an object', []);
        });
    }

    invalid<T>(key: string, expected: string, fallback: T): T {
        if (this.strict) throw new InvalidComponentException(this.field(key), expected);
        return fallback;
    }

    private field(key: string): string {
        return this.path ? `${this.path}.${key}` : key;
    }
}
