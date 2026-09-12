import { Language } from './valueObject/language';
import { PortfolioId } from './valueObject/portfolioId';

export class Portfolio {
    private readonly id: PortfolioId;

    private languages: Language[] = [];

    constructor(id: PortfolioId) {
        this.id = id;
    }

    getId(): PortfolioId {
        return this.id;
    }

    getLanguages(): Language[] {
        return [...this.languages];
    }

    addLanguage(language: Language): void {
        const alreadyDeclared = this.languages.some(lang => lang.getValue() === language.getValue());
        if (alreadyDeclared) return;
        this.languages.push(language);
    }

    removeLanguage(language: Language): void {
        this.languages = this.languages.filter(lang => lang.getValue() !== language.getValue());
    }
}
