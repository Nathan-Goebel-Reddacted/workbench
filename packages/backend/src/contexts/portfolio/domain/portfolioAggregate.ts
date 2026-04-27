import { Description } from "./value-objects/description";
import { Language } from "./value-objects/language";
import { PortfolioId } from "./value-objects/portfolioId";
import { UserId } from "./value-objects/userId";

export class Portfolio {
    private readonly id: PortfolioId

    private readonly userId: UserId

    private description: Description

    private languages: Language[] = [];

    constructor(
        id: PortfolioId,
        userId: UserId,
        description: Description
    ) {
        this.id = id;
        this.userId = userId;
        this.description = description;
    }

    getId(): PortfolioId {
        return this.id;
    }

    getUserId(): UserId {
        return this.userId;
    }
    
    getDescription(): Description {
        return this.description;
    }

    setDescription(description: Description): void {
        this.description = description;
    }

    getLanguages(): Language[] {
        return [...this.languages];
    }

    addLanguage(language: Language): void {
        this.languages.push(language);
    }

    removeLanguage(language: Language): void {
        this.languages = this.languages.filter(lang => lang.getValue() !== language.getValue());
    }
}