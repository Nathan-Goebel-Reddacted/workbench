import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListAllowedEmailsQuery } from './listAllowedEmailsQuery';
import { IAllowedEmailRepository } from '../../../domain/repository/iAllowedEmailRepository';

export class ListAllowedEmailsHandler implements IQueryHandler<ListAllowedEmailsQuery, string[]> {
    constructor(private readonly allowed: IAllowedEmailRepository) {}

    async handle(): Promise<string[]> {
        return (await this.allowed.findAll()).map(email => email.getValue());
    }
}
