import { InvalidSectionContentException } from '../../exception/invalidSectionContent';

type Raw = Record<string, unknown>;

export class ContentReader {
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
                throw new InvalidSectionContentException(this.field(key), `a number between ${min} and ${max}`);
            }
            return value;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
    }

    oneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
        const value = this.raw[key];
        if (value === undefined || value === null) return fallback;
        if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T;
        return this.invalid(key, `one of ${allowed.join(', ')}`, fallback);
    }

    list(key: string): ContentReader[] {
        const value = this.raw[key];
        if (value === undefined || value === null) return [];
        if (!Array.isArray(value)) return this.invalid(key, 'a list', []);
        return value.flatMap((item, index) => {
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                return [new ContentReader(item as Raw, this.strict, `${this.field(key)}[${index}]`)];
            }
            return this.invalid(`${key}[${index}]`, 'an object', []);
        });
    }

    invalid<T>(key: string, expected: string, fallback: T): T {
        if (this.strict) throw new InvalidSectionContentException(this.field(key), expected);
        return fallback;
    }

    private field(key: string): string {
        return this.path ? `${this.path}.${key}` : key;
    }
}
