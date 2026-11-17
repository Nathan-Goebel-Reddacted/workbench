export class SiteOrigins {
    private readonly origins: ReadonlySet<string>;

    constructor(urls: readonly string[]) {
        this.origins = new Set(urls.flatMap(url => SiteOrigins.originOf(url) ?? []));
    }

    static none(): SiteOrigins {
        return new SiteOrigins([]);
    }

    contains(url: string): boolean {
        const origin = SiteOrigins.originOf(url);
        return origin !== null && this.origins.has(origin);
    }

    private static originOf(url: string): string | null {
        try {
            return new URL(url).origin;
        } catch {
            return null;
        }
    }
}
