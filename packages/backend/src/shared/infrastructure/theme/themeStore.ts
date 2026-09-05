import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

const CONFIG_PATH = join(process.cwd(), 'theme-config.json');
const BACKUP_PATH = join(process.cwd(), 'theme-config.legacy.json');
const MIGRATED_THEME_NAME = 'Mon thème';

export type ThemeColors = Record<string, string>;

export type ThemeDefinition = {
    id: string;
    name: string;
    visible: boolean;
    colors: ThemeColors;
};

export type ThemeDraft = Omit<ThemeDefinition, 'id'>;

export type ThemeCatalog = {
    themes: ThemeDefinition[];
    defaultId: string | null;
};

export function readCatalog(): ThemeCatalog {
    const raw = readRaw();
    if (raw === null) return { themes: [], defaultId: null };
    if (isCatalog(raw)) return raw;

    // Ancien format : une palette unique à plat. On la garde en la promouvant en
    // premier thème plutôt que de la perdre.
    return migrate(raw as ThemeColors);
}

export function readVisibleCatalog(): ThemeCatalog {
    const catalog = readCatalog();
    return { themes: catalog.themes.filter(theme => theme.visible), defaultId: catalog.defaultId };
}

export function createTheme(draft: ThemeDraft): ThemeDefinition {
    const catalog = readCatalog();
    const theme: ThemeDefinition = { id: randomUUID(), ...draft };
    catalog.themes.push(theme);
    if (catalog.defaultId === null) catalog.defaultId = theme.id;
    writeCatalog(catalog);
    return theme;
}

export function updateTheme(id: string, draft: ThemeDraft): boolean {
    const catalog = readCatalog();
    const index = catalog.themes.findIndex(theme => theme.id === id);
    if (index === -1) return false;
    catalog.themes[index] = { id, ...draft };
    writeCatalog(catalog);
    return true;
}

export function setDefaultTheme(id: string): boolean {
    const catalog = readCatalog();
    if (!catalog.themes.some(theme => theme.id === id)) return false;
    catalog.defaultId = id;
    writeCatalog(catalog);
    return true;
}

function readRaw(): unknown {
    if (!existsSync(CONFIG_PATH)) return null;
    try {
        return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {
        return null;
    }
}

function isCatalog(raw: unknown): raw is ThemeCatalog {
    return typeof raw === 'object' && raw !== null && Array.isArray((raw as ThemeCatalog).themes);
}

function migrate(colors: ThemeColors): ThemeCatalog {
    if (Object.keys(colors).length === 0) return { themes: [], defaultId: null };

    const theme: ThemeDefinition = {
        id: randomUUID(),
        name: MIGRATED_THEME_NAME,
        visible: true,
        colors,
    };
    const catalog: ThemeCatalog = { themes: [theme], defaultId: theme.id };

    // L'ancien fichier est conservé tel quel : si la conversion tourne mal, la palette
    // d'origine est encore lisible à côté.
    if (!existsSync(BACKUP_PATH)) copyFileSync(CONFIG_PATH, BACKUP_PATH);
    writeCatalog(catalog);

    return catalog;
}

function writeCatalog(catalog: ThemeCatalog): void {
    const tempPath = `${CONFIG_PATH}.tmp`;
    writeFileSync(tempPath, JSON.stringify(catalog, null, 2) + '\n');
    renameSync(tempPath, CONFIG_PATH);
}
