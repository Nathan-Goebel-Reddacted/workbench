import { ComponentReader } from './componentReader';
import { DERIVED_SCREENS, DerivedScreen, SCREEN_SIZES, ScreenSize } from '../valueObject/screenSize';

export const TEXT_FONTS = ['heading', 'body'] as const;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 160;
export const DEFAULT_FONT_SIZE = 16;
export const FONT_SIZE_FLOORS: Readonly<Record<DerivedScreen, number>> = { tablet: 15, mobile: 14 };
export const MIN_LETTER_SPACING = -0.05;
export const MAX_LETTER_SPACING = 0.5;

export type FontSizes = Readonly<Record<ScreenSize, number>>;

export function derivedFontSize(desktop: number, screen: DerivedScreen): number {
    const scaled = Math.round((desktop * SCREEN_SIZES[screen]) / SCREEN_SIZES.desktop);
    return Math.min(desktop, Math.max(FONT_SIZE_FLOORS[screen], scaled));
}

function derivedFrom(desktop: number): FontSizes {
    return { desktop, tablet: derivedFontSize(desktop, 'tablet'), mobile: derivedFontSize(desktop, 'mobile') };
}

export function readFontSizes(component: ComponentReader): FontSizes {
    const size = (reader: ComponentReader, key: string, fallback: number) =>
        reader.integer(key, fallback, MIN_FONT_SIZE, MAX_FONT_SIZE);
    if (component.isNumber('fontSize')) return derivedFrom(size(component, 'fontSize', DEFAULT_FONT_SIZE));
    const sizes = component.child('fontSize');
    if (!sizes) return derivedFrom(DEFAULT_FONT_SIZE);
    const desktop = size(sizes, 'desktop', DEFAULT_FONT_SIZE);
    const derived = derivedFrom(desktop);
    return {
        desktop,
        tablet: sizes.has('tablet') ? size(sizes, 'tablet', derived.tablet) : derived.tablet,
        mobile: sizes.has('mobile') ? size(sizes, 'mobile', derived.mobile) : derived.mobile,
    };
}

export function reconcileFontSizes(previous: FontSizes, next: FontSizes): FontSizes {
    if (previous.desktop === next.desktop) return next;
    const result: Record<ScreenSize, number> = { ...next };
    for (const screen of DERIVED_SCREENS) {
        if (next[screen] === previous[screen]) result[screen] = derivedFontSize(next.desktop, screen);
    }
    return result;
}

export function fontSizesOf(value: Readonly<Record<string, unknown>>): FontSizes {
    const sizes = value.fontSize as FontSizes | undefined;
    return sizes ?? derivedFrom(DEFAULT_FONT_SIZE);
}
