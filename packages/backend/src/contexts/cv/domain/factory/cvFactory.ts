import { Cv } from '../cvAggregate';

export class CvFactory {
    create(id: string, name: string, fileUrl: string, displayOrder: number, createdAt: Date = new Date()): Cv {
        return Cv.create(id, name, fileUrl, displayOrder, createdAt);
    }
}
