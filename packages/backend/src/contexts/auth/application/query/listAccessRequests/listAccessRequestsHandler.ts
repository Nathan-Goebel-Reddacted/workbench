import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListAccessRequestsQuery } from './listAccessRequestsQuery';
import { AccessRequestDto } from './accessRequestDto';
import { IAccessRequestRepository } from '../../../domain/repository/iAccessRequestRepository';

export class ListAccessRequestsHandler implements IQueryHandler<ListAccessRequestsQuery, AccessRequestDto[]> {
    constructor(private readonly requests: IAccessRequestRepository) {}

    async handle(): Promise<AccessRequestDto[]> {
        return (await this.requests.findAll()).map(request => ({
            email: request.getEmail().getValue(),
            displayName: request.getDisplayName(),
            status: request.getStatus(),
            createdAt: request.getCreatedAt(),
            updatedAt: request.getUpdatedAt(),
        }));
    }
}
