export type PortfolioDto = Readonly<{
    id: string;
    userId: string;
    description: string;
    languages: string[];
    links: Array<{ url: string; displayText: string; logo: string }>;
}>;
