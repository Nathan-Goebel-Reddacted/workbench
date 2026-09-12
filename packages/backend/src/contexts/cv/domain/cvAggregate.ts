import { CvId } from './valueObject/cvId';
import { CvName } from './valueObject/cvName';
import { CvFileUrl } from './valueObject/cvFileUrl';

/**
 * Un CV proposé au téléchargement sur le site public.
 *
 * Le fichier ne change pas : remplacer un CV, c'est en déposer un autre. `displayOrder` donne
 * l'ordre de la page, `visible` dit lesquels le visiteur voit.
 */
export class Cv {
    constructor(
        private readonly id: CvId,
        private readonly name: CvName,
        private readonly fileUrl: CvFileUrl,
        private visible: boolean,
        private displayOrder: number,
        private readonly createdAt: Date,
    ) {}

    getId(): CvId {
        return this.id;
    }

    getName(): CvName {
        return this.name;
    }

    getFileUrl(): CvFileUrl {
        return this.fileUrl;
    }

    isVisible(): boolean {
        return this.visible;
    }

    getDisplayOrder(): number {
        return this.displayOrder;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    /** Le CV devient téléchargeable depuis le site public. */
    publish(): void {
        this.visible = true;
    }

    hide(): void {
        this.visible = false;
    }

    moveTo(displayOrder: number): void {
        this.displayOrder = displayOrder;
    }
}
