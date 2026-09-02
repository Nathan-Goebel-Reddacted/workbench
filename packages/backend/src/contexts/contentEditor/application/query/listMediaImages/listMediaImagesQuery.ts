import { Query } from '@shared/application/query/query';

// "document" : tout document affichable — image, vidéo, PDF ou mindmap. C'est le mode
// du widget document unifié comme du carrousel, qui rendent tous deux les quatre formes
// (ADR-010). Les autres modes restreignent à un seul type.
export type MediaKind = 'image' | 'video' | 'mindmap' | 'document';

export class ListMediaImagesQuery implements Query {
    static readonly queryName = 'contentEditor.ListMediaImages';
    readonly queryName: string;

    constructor(readonly kind: MediaKind = 'image') {
        this.queryName = ListMediaImagesQuery.queryName;
    }
}
