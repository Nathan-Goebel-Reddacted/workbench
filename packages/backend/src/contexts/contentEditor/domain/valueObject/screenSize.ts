import { UnknownScreenSizeException } from '../exception/unknownScreenSize';

export const SCREEN_SIZES = { desktop: 1280, tablet: 768, mobile: 360 } as const;

export type ScreenSize = keyof typeof SCREEN_SIZES;

export const SCREENS = Object.keys(SCREEN_SIZES) as ScreenSize[];

export const DERIVED_SCREENS = ['tablet', 'mobile'] as const satisfies readonly ScreenSize[];

export type DerivedScreen = (typeof DERIVED_SCREENS)[number];

export const MAX_SCREEN_HEIGHTS: Readonly<Record<ScreenSize, number>> = {
    desktop: 20000,
    tablet: 40000,
    mobile: 80000,
};

export const SCREEN_MIN_VIEWPORTS: Readonly<Record<ScreenSize, number>> = { desktop: 1280, tablet: 768, mobile: 0 };

export function isScreenSize(value: string): value is ScreenSize {
    return Object.hasOwn(SCREEN_SIZES, value);
}

export function parseScreenSize(value: string): ScreenSize {
    if (!isScreenSize(value)) throw new UnknownScreenSizeException(value, SCREENS);
    return value;
}

export function parseDerivedScreen(value: string): DerivedScreen {
    const screen = parseScreenSize(value);
    if (screen === 'desktop') throw new UnknownScreenSizeException(value, DERIVED_SCREENS);
    return screen;
}
