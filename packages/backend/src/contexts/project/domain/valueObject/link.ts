import { InvalidLogoException } from '../exception/invalidLogo';
import { InvalidLinkUrlException } from '../exception/invalidLinkUrl';

const VALID_LOGO_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];

export class Link {
    private readonly url: string;

    private readonly displayText: string;

    private readonly logo: string;

    private readonly replacesPage: boolean;

    constructor(url: string, displayText: string, logo: string = '', replacesPage: boolean = false) {
        this.url = url.trim();
        this.displayText = displayText.trim();
        this.logo = logo.trim();
        this.replacesPage = replacesPage;

        this.validateUrl(this.url);
        if (this.logo) this.validateLogo(this.logo);
    }

    private validateUrl(url: string): void {
        try {
            new URL(url);
        } catch {
            throw new InvalidLinkUrlException();
        }
    }

    private validateLogo(logo: string): void {
        if (logo.startsWith('data:image/')) return;
        const ext = logo.slice(logo.lastIndexOf('.')).toLowerCase();
        if (!VALID_LOGO_EXTENSIONS.includes(ext)) {
            throw new InvalidLogoException();
        }
    }

    getUrl(): string {
        return this.url;
    }

    getDisplayText(): string {
        return this.displayText;
    }

    getLogo(): string {
        return this.logo;
    }

    isReplacingPage(): boolean {
        return this.replacesPage;
    }

    replacingPage(replaces: boolean): Link {
        return new Link(this.url, this.displayText, this.logo, replaces);
    }
}
