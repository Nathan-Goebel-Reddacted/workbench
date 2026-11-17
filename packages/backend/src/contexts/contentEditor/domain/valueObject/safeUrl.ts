const UPLOAD_PATH = /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/;
const PROJECT_PAGE = /^\/projects\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WEB_PROTOCOLS = ['http:', 'https:'];

export function parseSafeUrl(raw: string): string | null {
    const value = raw.trim();
    if (UPLOAD_PATH.test(value) || PROJECT_PAGE.test(value)) return value;
    if (!/^https?:\/\//i.test(value)) return null;
    try {
        const url = new URL(value);
        if (!WEB_PROTOCOLS.includes(url.protocol) || url.hostname === '') return null;
        return url.href;
    } catch {
        return null;
    }
}
