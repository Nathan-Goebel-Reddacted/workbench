import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { IFileStorage } from '@shared/application/port/iFileStorage';
import { assertStoredMindmapName } from '@shared/domain/valueObject/uploadFilename';
import { GetMindmapQuery } from './getMindmapQuery';

export class GetMindmapHandler implements IQueryHandler<GetMindmapQuery, unknown> {
    constructor(private readonly files: IFileStorage) {}

    async handle(query: GetMindmapQuery): Promise<unknown> {
        assertStoredMindmapName(query.filename);
        const content = await this.files.read(query.filename);
        return content === null ? null : JSON.parse(content);
    }
}
