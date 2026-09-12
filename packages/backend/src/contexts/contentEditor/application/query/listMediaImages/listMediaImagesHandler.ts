import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListMediaImagesQuery } from './listMediaImagesQuery';
import { ProjectImagesDto } from './mediaImageDto';
import { IMediaLibrary } from '../../../domain/port/iMediaLibrary';

/**
 * Lecture transverse : l'éditeur propose les médias déjà attachés aux projets, features et
 * tickets. Il ne connaît aucun de ces contextes — il pose sa question à `IMediaLibrary`, et
 * l'adaptateur, seul, sait à qui s'adresser.
 */
export class ListMediaImagesHandler implements IQueryHandler<ListMediaImagesQuery, ProjectImagesDto[]> {
    constructor(private readonly library: IMediaLibrary) {}

    async handle(query: ListMediaImagesQuery): Promise<ProjectImagesDto[]> {
        return this.library.browse(query.kind);
    }
}
