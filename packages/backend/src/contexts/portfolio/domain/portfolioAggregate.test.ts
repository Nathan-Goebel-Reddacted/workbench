import { describe, expect, it } from 'vitest';
import { Portfolio } from './portfolioAggregate.js';
import { PortfolioId } from './valueObject/portfolioId.js';
import { Language, LanguageEnum } from './valueObject/language.js';

// Le Portfolio ne porte qu'une chose : les langages déclarés. Ils forment un ensemble, pas
// une liste — déclarer deux fois TypeScript ne le rend pas plus vrai.

describe('Portfolio — langages', () => {
    it('déclare un langage', () => {
        const portfolio = new Portfolio(new PortfolioId());

        portfolio.addLanguage(new Language(LanguageEnum.TYPESCRIPT));

        expect(portfolio.getLanguages().map(l => l.getValue())).toEqual([LanguageEnum.TYPESCRIPT]);
    });

    it('ignore un langage déjà déclaré plutôt que de le doubler', () => {
        const portfolio = new Portfolio(new PortfolioId());

        portfolio.addLanguage(new Language(LanguageEnum.PHP));
        portfolio.addLanguage(new Language(LanguageEnum.PHP));

        expect(portfolio.getLanguages()).toHaveLength(1);
    });

    it('retire un langage sans toucher aux autres', () => {
        const portfolio = new Portfolio(new PortfolioId());
        portfolio.addLanguage(new Language(LanguageEnum.PHP));
        portfolio.addLanguage(new Language(LanguageEnum.RUST));

        portfolio.removeLanguage(new Language(LanguageEnum.PHP));

        expect(portfolio.getLanguages().map(l => l.getValue())).toEqual([LanguageEnum.RUST]);
    });

    it('rend une copie : modifier la liste rendue ne déclare rien', () => {
        const portfolio = new Portfolio(new PortfolioId());

        portfolio.getLanguages().push(new Language(LanguageEnum.GO));

        expect(portfolio.getLanguages()).toHaveLength(0);
    });
});
