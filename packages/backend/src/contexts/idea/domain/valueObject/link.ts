import { InvalidLogoException } from '../exception/invalidLogo';
import { InvalidLinkUrlException } from '../exception/invalidLinkUrl';

const VALID_LOGO_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];

export class Link {
    private readonly url: string;

    private readonly displayText: string;

    private readonly logo: string;

    constructor(url: string, displayText: string, logo: string) {
        this.url = url.trim();
        this.displayText = displayText.trim();
        this.logo = logo.trim();

        this.validateUrl(this.url);
        this.validateLogo(this.logo);
    }

    private validateUrl(url: string): void {
        try {
            new URL(url);
        } catch {
            throw new InvalidLinkUrlException();
        }
    }

    private validateLogo(logo: string): void {
        const ext = logo.slice(logo.lastIndexOf('.')).toLowerCase();
        if (!logo || !VALID_LOGO_EXTENSIONS.includes(ext)) {
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
}
