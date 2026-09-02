import { EntityManager } from '@mikro-orm/postgresql';
import { IPortfolioRepository } from '../../domain/repository/iPortfolioRepository';
import { Portfolio } from '../../domain/portfolioAggregate';
import { PortfolioOrmEntity } from '../entity/portfolioOrmEntity';
import { PortfolioId } from '../../domain/valueObject/portfolioId';
import { Language, LanguageEnum } from '../../domain/valueObject/language';

export class PortfolioRepository implements IPortfolioRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: string): Promise<Portfolio | null> {
        const e = await this.em.findOne(PortfolioOrmEntity, { id });
        return e ? this.toDomain(e) : null;
    }

    async find(): Promise<Portfolio | null> {
        // Tri explicite : sans lui, une base contenant plusieurs lignes servirait un
        // portfolio différent d'une requête à l'autre.
        const [e] = await this.em.find(PortfolioOrmEntity, {}, { orderBy: { id: 'asc' }, limit: 1 });
        return e ? this.toDomain(e) : null;
    }

    async save(portfolio: Portfolio): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(PortfolioOrmEntity, this.toOrm(portfolio));
        });
    }

    private toDomain(e: PortfolioOrmEntity): Portfolio {
        const portfolio = new Portfolio(new PortfolioId(e.id));
        e.languages.forEach(lang => portfolio.addLanguage(new Language(lang as LanguageEnum)));
        return portfolio;
    }

    private toOrm(portfolio: Portfolio): PortfolioOrmEntity {
        const e = new PortfolioOrmEntity();
        e.id = portfolio.getId().getValue();
        e.languages = portfolio.getLanguages().map(l => l.getValue());
        return e;
    }
}
