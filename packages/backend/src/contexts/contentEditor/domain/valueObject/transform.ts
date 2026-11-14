import { InvalidTransformException } from '../exception/invalidTransform';

export const REFERENCE_WIDTH = 1440;
export const MAX_PAGE_HEIGHT = 20000;

export class Transform {
    private readonly x: number;
    private readonly y: number;
    private readonly w: number;
    private readonly h: number;

    constructor(x: number, y: number, w: number, h: number) {
        const integers = [x, y, w, h].every(Number.isInteger);
        if (!integers || x < 0 || y < 0 || w < 1 || h < 1 || x + w > REFERENCE_WIDTH || y + h > MAX_PAGE_HEIGHT) {
            throw new InvalidTransformException(REFERENCE_WIDTH, MAX_PAGE_HEIGHT);
        }
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
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

    equals(other: Transform): boolean {
        return this.x === other.x && this.y === other.y && this.w === other.w && this.h === other.h;
    }
}
