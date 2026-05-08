import { InvalidGridPositionException } from "../exception/invalidGridPosition";

export class GridPosition {
    private readonly column: number;
    private readonly order: number;

    constructor(column: number, order: number) {
        if (column < 1 || order < 0) {
            throw new InvalidGridPositionException();
        }
        this.column = column;
        this.order = order;
    }

    getColumn(): number {
        return this.column;
    }

    getOrder(): number {
        return this.order;
    }

    equals(other: GridPosition): boolean {
        return this.column === other.column && this.order === other.order;
    }
}
