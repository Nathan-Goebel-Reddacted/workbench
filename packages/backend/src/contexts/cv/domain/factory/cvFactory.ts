import { Cv } from '../cvAggregate';
import { CvId } from '../valueObject/cvId';
import { CvName } from '../valueObject/cvName';
import { CvFileUrl } from '../valueObject/cvFileUrl';

export class CvFactory {
    /** Un CV naît visible : on ne dépose pas un CV pour le cacher. */
    create(id: string, name: string, fileUrl: string, displayOrder: number, createdAt: Date = new Date()): Cv {
        return new Cv(new CvId(id), new CvName(name), new CvFileUrl(fileUrl), true, displayOrder, createdAt);
    }

    /** Reconstruction depuis la persistance : les valeurs ont déjà été validées une fois. */
    rehydrate(id: string, name: string, fileUrl: string, visible: boolean, displayOrder: number, createdAt: Date): Cv {
        return new Cv(new CvId(id), new CvName(name), new CvFileUrl(fileUrl), visible, displayOrder, createdAt);
    }
}
