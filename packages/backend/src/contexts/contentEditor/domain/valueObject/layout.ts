import { InvalidLayoutException } from '../exception/invalidLayout';
import { SCREENS, ScreenSize } from './screenSize';
import { Transform } from './transform';

export type Placement = Readonly<{ transform: Transform; hidden: boolean }>;

export class Layout {
    private constructor(
        private readonly placements: Readonly<Record<ScreenSize, Placement>>,
        private readonly origin: ScreenSize,
    ) {}

    static of(placements: Readonly<Record<ScreenSize, Placement>>, origin: ScreenSize = 'desktop'): Layout {
        for (const screen of SCREENS) {
            const placement = placements[screen];
            if (!placement || placement.transform.getScreen() !== screen) throw new InvalidLayoutException(screen);
        }
        return new Layout({ ...placements }, origin);
    }

    getOrigin(): ScreenSize {
        return this.origin;
    }

    placement(screen: ScreenSize): Placement {
        return this.placements[screen];
    }

    transform(screen: ScreenSize): Transform {
        return this.placements[screen].transform;
    }

    isHidden(screen: ScreenSize): boolean {
        return this.placements[screen].hidden;
    }

    hiddenEverywhere(): boolean {
        return SCREENS.every(screen => this.placements[screen].hidden);
    }

    with(screen: ScreenSize, placement: Partial<Placement>): Layout {
        return Layout.of({ ...this.placements, [screen]: { ...this.placements[screen], ...placement } }, this.origin);
    }

    map(change: (placement: Placement, screen: ScreenSize) => Placement): Layout {
        const next = {} as Record<ScreenSize, Placement>;
        for (const screen of SCREENS) next[screen] = change(this.placements[screen], screen);
        return Layout.of(next, this.origin);
    }
}
