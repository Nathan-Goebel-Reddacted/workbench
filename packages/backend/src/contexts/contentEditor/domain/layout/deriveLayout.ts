import { DerivedScreen, SCREEN_SIZES } from '../valueObject/screenSize';
import { Placement } from '../valueObject/layout';
import { Transform } from '../valueObject/transform';
import { readingRows } from './readingRows';

export const LAYOUT_GUTTER = 16;
export const STACK_GAP = 24;

export type ContentFlow = 'text' | 'visual' | null;

export type LayoutSource = Readonly<{
    id: string;
    desktop: Transform;
    hiddenOnDesktop: boolean;
    flow: ContentFlow;
    heightRatio: number;
}>;

export function stackWidth(screen: DerivedScreen): number {
    return SCREEN_SIZES[screen] - 2 * LAYOUT_GUTTER;
}

export function derivedHeight(desktop: Transform, flow: ContentFlow, width: number, heightRatio = 1): number {
    if (flow === 'text') return ((desktop.getH() * desktop.getW()) / width) * heightRatio;
    return (width * desktop.getH()) / desktop.getW();
}

export function placeBelow(screen: DerivedScreen, bottom: number, desktop: Transform): Transform {
    return placeAt(screen, bottom + STACK_GAP, desktop);
}

export function placeAt(screen: DerivedScreen, y: number, desktop: Transform): Transform {
    const width = stackWidth(screen);
    return Transform.clamped(screen, LAYOUT_GUTTER, y, width, derivedHeight(desktop, null, width));
}

export function fitFirstContent(
    current: Transform,
    desktop: Transform,
    flow: ContentFlow,
    heightRatio: number,
): Transform {
    return current.withHeight(derivedHeight(desktop, flow, current.getW(), heightRatio));
}

export function regenerate(screen: DerivedScreen, sources: readonly LayoutSource[]): Map<string, Placement> {
    const width = stackWidth(screen);
    const placements = new Map<string, Placement>();
    let y = STACK_GAP;
    const stack = (source: LayoutSource, hidden: boolean) => {
        const transform = Transform.clamped(
            screen,
            LAYOUT_GUTTER,
            y,
            width,
            derivedHeight(source.desktop, source.flow, width, source.heightRatio),
        );
        placements.set(source.id, { transform, hidden });
        y = transform.bottom() + STACK_GAP;
    };

    const visible = sources
        .filter(source => !source.hiddenOnDesktop)
        .map(source => ({ ...source, transform: source.desktop }));
    for (const source of readingRows(visible).flat()) stack(source, false);
    for (const source of sources.filter(s => s.hiddenOnDesktop)) stack(source, true);
    return placements;
}
