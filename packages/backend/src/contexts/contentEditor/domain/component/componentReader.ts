import { InvalidComponentException } from '../exception/invalidComponent';
import { ColorValue, parseColor } from '../valueObject/color';

type Raw = Record<string, unknown>;

export class ComponentReader {
    constructor(
        private readonly raw: Raw,
        private readonly strict: boolean,
        private readonly path: string,
    ) {}

    isStrict(): boolean {
        return this.strict;
    }

    has(key: string): boolean {
        return this.raw[key] !== undefined && this.raw[key] !== null;
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
                return [new ComponentReader(item as Raw, this.strict, `${this.field(key)}[${index}]`)];
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
