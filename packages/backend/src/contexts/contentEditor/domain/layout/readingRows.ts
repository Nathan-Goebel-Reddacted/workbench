import { Transform } from '../valueObject/transform';

type Placed = Readonly<{ transform: Transform }>;

function overlapsEnough(a: Transform, b: Transform): boolean {
    const overlap = Math.min(a.bottom(), b.bottom()) - Math.max(a.getY(), b.getY());
    return overlap > Math.min(a.getH(), b.getH()) / 2;
}

export function readingRows<T extends Placed>(elements: readonly T[]): T[][] {
    const byTop = [...elements].sort(
        (a, b) => a.transform.getY() - b.transform.getY() || a.transform.getX() - b.transform.getX(),
    );
    const rows: T[][] = [];

    for (const element of byTop) {
        const row = rows[rows.length - 1];
        if (row?.some(member => overlapsEnough(member.transform, element.transform))) row.push(element);
        else rows.push([element]);
    }

    return rows.map(row =>
        row.sort((a, b) => a.transform.getX() - b.transform.getX() || a.transform.getY() - b.transform.getY()),
    );
}
