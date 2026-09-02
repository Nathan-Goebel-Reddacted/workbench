import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListCvsQuery } from './listCvsQuery';
import { CvDto } from './cvDto';
import { ICvRepository } from '../../../domain/repository/iCvRepository';
import { Cv } from '../../../domain/cvAggregate';

export class ListCvsHandler implements IQueryHandler<ListCvsQuery, CvDto[]> {
    constructor(private readonly repository: ICvRepository) {}

    async handle(query: ListCvsQuery): Promise<CvDto[]> {
        const cvs = await this.repository.findAll();
        const exposed = query.includeHidden ? cvs : cvs.filter(cv => cv.isVisible());
        return exposed.map(cv => this.toDto(cv));
    }

    private toDto(cv: Cv): CvDto {
        return {
            id: cv.getId(),
            name: cv.getName(),
            fileUrl: cv.getFileUrl(),
            visible: cv.isVisible(),
            displayOrder: cv.getDisplayOrder(),
            createdAt: cv.getCreatedAt().toISOString(),
        };
    }
}
