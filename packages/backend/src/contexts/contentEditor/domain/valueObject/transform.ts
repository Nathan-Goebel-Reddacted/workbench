import { InvalidTransformException } from '../exception/invalidTransform';
import { MAX_SCREEN_HEIGHTS, SCREEN_SIZES, ScreenSize } from './screenSize';

export class Transform {
    private readonly x: number;
    private readonly y: number;
    private readonly w: number;
    private readonly h: number;

    constructor(
        private readonly screen: ScreenSize,
        x: number,
        y: number,
        w: number,
        h: number,
    ) {
        const width = SCREEN_SIZES[screen];
        const maxHeight = MAX_SCREEN_HEIGHTS[screen];
        const integers = [x, y, w, h].every(Number.isInteger);
        if (!integers || x < 0 || y < 0 || w < 1 || h < 1 || x + w > width || y + h > maxHeight) {
            throw new InvalidTransformException(screen, width, maxHeight);
        }
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    static clamped(screen: ScreenSize, x: number, y: number, w: number, h: number): Transform {
        const width = SCREEN_SIZES[screen];
        const maxHeight = MAX_SCREEN_HEIGHTS[screen];
        const cw = Math.min(Math.max(Math.round(w), 1), width);
        const ch = Math.min(Math.max(Math.round(h), 1), maxHeight);
        const cx = Math.min(Math.max(Math.round(x), 0), width - cw);
        const cy = Math.min(Math.max(Math.round(y), 0), maxHeight - ch);
        return new Transform(screen, cx, cy, cw, ch);
    }

    getScreen(): ScreenSize {
        return this.screen;
    }

    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
    }

    getW(): number {
        return this.w;
    }

    getH(): number {
        return this.h;
    }

    bottom(): number {
        return this.y + this.h;
    }

    withHeight(h: number): Transform {
        return Transform.clamped(this.screen, this.x, this.y, this.w, h);
    }

    offset(by: number): Transform {
        return Transform.clamped(this.screen, this.x + by, this.y + by, this.w, this.h);
    }

    equals(other: Transform): boolean {
        return (
            this.screen === other.screen &&
            this.x === other.x &&
            this.y === other.y &&
            this.w === other.w &&
            this.h === other.h
        );
    }
}
