import { InvalidGridPositionException } from '../exception/invalidGridPosition';

export const GRID_COLUMNS = 12;

export class GridPosition {
    private readonly x: number;
    private readonly y: number;
    private readonly w: number;
    private readonly h: number;

    constructor(x: number, y: number, w: number, h: number) {
        if (x < 0 || y < 0 || w < 1 || h < 1 || x + w > GRID_COLUMNS) {
            throw new InvalidGridPositionException();
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

    equals(other: GridPosition): boolean {
        return this.x === other.x && this.y === other.y && this.w === other.w && this.h === other.h;
    }
}
