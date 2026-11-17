export type ThemeColor = Readonly<{ theme: string }>;
export type HexColor = Readonly<{ hex: string }>;
export type ColorValue = ThemeColor | HexColor;

const THEME_VARIABLE = /^--color-[a-z0-9-]+$/;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const CSS_THEME_VARIABLE = /^var\(\s*(--color-[a-z0-9-]+)\s*\)$/;
const CSS_RGB = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i;
const CSS_KEYWORDS = ['inherit', 'transparent', 'currentcolor'];

export function parseColor(raw: unknown): ColorValue | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const keys = Object.keys(raw);
    if (keys.length !== 1) return null;
    const { theme, hex } = raw as Record<string, unknown>;
    if (typeof theme === 'string' && THEME_VARIABLE.test(theme)) return { theme };
    if (typeof hex === 'string' && HEX.test(hex)) return { hex: hex.toLowerCase() };
    return null;
}

export function safeCssColor(css: string): string | null {
    const value = css.trim();
    if (HEX.test(value)) return value.toLowerCase();
    if (CSS_KEYWORDS.includes(value.toLowerCase())) return value.toLowerCase();
    const variable = CSS_THEME_VARIABLE.exec(value);
    if (variable) return `var(${variable[1]})`;
    const rgb = CSS_RGB.exec(value);
    if (rgb) return rgbToHex(rgb.slice(1, 4).map(Number), rgb[4]);
    return null;
}

function rgbToHex(channels: number[], alpha: string | undefined): string | null {
    if (channels.some(c => c > 255)) return null;
    const parts = [...channels];
    if (alpha !== undefined) {
        const a = Number(alpha);
        if (a > 1) return null;
        if (a < 1) parts.push(Math.round(a * 255));
    }
    return `#${parts.map(c => c.toString(16).padStart(2, '0')).join('')}`;
}
