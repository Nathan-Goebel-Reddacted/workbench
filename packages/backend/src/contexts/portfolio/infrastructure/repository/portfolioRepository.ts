import { EntityManager } from '@mikro-orm/postgresql';
import type { UUID } from 'crypto';
import { IPortfolioRepository } from '../../domain/repository/iPortfolioRepository';
import { Portfolio } from '../../domain/portfolioAggregate';
import { PortfolioOrmEntity } from '../entity/portfolioOrmEntity';
import { PortfolioId } from '../../domain/value-objects/portfolioId';
import { UserId } from '../../domain/value-objects/userId';
import { Description } from '../../domain/value-objects/description';
import { Link } from '../../domain/value-objects/link';
import { Language, LanguageEnum } from '../../domain/value-objects/language';

export class PortfolioRepository implements IPortfolioRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: string): Promise<Portfolio | null> {
        const e = await this.em.findOne(PortfolioOrmEntity, { id });
        return e ? this.toDomain(e) : null;
    }

    async findByUserId(userId: string): Promise<Portfolio | null> {
        const e = await this.em.findOne(PortfolioOrmEntity, { userId });
        return e ? this.toDomain(e) : null;
    }

    async save(portfolio: Portfolio): Promise<void> {
        await this.em.transactional(async (em) => {
            await em.upsert(PortfolioOrmEntity, this.toOrm(portfolio));
        });
    }

    private toDomain(e: PortfolioOrmEntity): Portfolio {
        const portfolio = new Portfolio(
            new PortfolioId(e.id),
            new UserId(e.userId as UUID),
            new Description(e.description),
            e.links.map(l => new Link(l.url, l.displayText, l.logo)),
        );
        e.languages.forEach(lang => portfolio.addLanguage(new Language(lang as LanguageEnum)));
        return portfolio;
    }

    private toOrm(portfolio: Portfolio): PortfolioOrmEntity {
        const e = new PortfolioOrmEntity();
        e.id = portfolio.getId().getValue();
        e.userId = portfolio.getUserId().getValue() as string;
        e.description = portfolio.getDescription().getValue();
        e.languages = portfolio.getLanguages().map(l => l.getValue());
        e.links = portfolio.getLinks().map(l => ({
            url: l.getUrl(),
            displayText: l.getDisplayText(),
            logo: l.getLogo(),
        }));
        return e;
    }
}
