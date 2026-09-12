import { Query } from '@shared/application/query/query';
import { MediaKind } from '../../../domain/port/iMediaLibrary';

export type { MediaKind };

export class ListMediaImagesQuery implements Query {
    static readonly queryName = 'contentEditor.ListMediaImages';
    readonly queryName = ListMediaImagesQuery.queryName;

    constructor(readonly kind: MediaKind = 'image') {}
}
