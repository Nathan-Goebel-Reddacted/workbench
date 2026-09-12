import { Migration } from '@mikro-orm/migrations';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

/** Le catalogue tel que le fichier le portait — les deux formes qu'il a connues. */
type FileTheme = { id?: string; name?: string; visible?: boolean; colors?: Record<string, string> };
type FileCatalog = { themes?: FileTheme[]; defaultId?: string | null };

const CONFIG_PATH = join(process.cwd(), 'theme-config.json');
const LEGACY_THEME_NAME = 'Mon thème';

/**
 * Les thèmes quittent le fichier JSON pour la base.
 *
 * Le fichier vivait dans le répertoire de travail du processus : il disparaissait à chaque
 * redéploiement du conteneur, et deux écritures simultanées s'écrasaient l'une l'autre.
 *
 * La reprise est tolérante et sans perte : le fichier n'est ni supprimé ni déplacé, il est
 * seulement lu. S'il est absent ou illisible, la migration se contente de créer la
 * structure. Rien n'est écrit hors de la transaction, donc un échec la laisse rejouable.
 */
export class Migration20260912000000_AddThemes extends Migration {
    override async up(): Promise<void> {
        this.addSql(`create table "themes" (
      "id" varchar(255) not null,
      "name" varchar(255) not null,
      "colors" jsonb not null,
      "visible" boolean not null default true,
      "is_default" boolean not null default false,
      "created_at" timestamptz not null default now(),
      constraint "themes_pkey" primary key ("id")
    );`);

        // Un seul thème par défaut, garanti par la base : deux écritures concurrentes ne
        // peuvent pas en produire deux, et le site public n'a jamais à choisir au hasard.
        this.addSql(`create unique index "themes_single_default_index" on "themes" ("is_default") where "is_default";`);
        this.addSql(`create index "themes_visible_index" on "themes" ("visible");`);

        for (const statement of this.importStatements()) this.addSql(statement);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "themes" cascade;`);
    }

    /** Traduit le fichier en insertions, ou rend une liste vide s'il n'y a rien à reprendre. */
    private importStatements(): string[] {
        const catalog = readCatalog();
        if (!catalog || catalog.themes.length === 0) return [];

        const statements = catalog.themes.map((theme, index) => {
            const isDefault = theme.id === catalog.defaultId;
            // Le fichier n'horodatait rien : l'ordre du tableau est le seul ordre connu,
            // et c'est celui que le Design Lab affichait. On le préserve en l'échelonnant.
            const createdAt = `now() - interval '${catalog.themes.length - index} seconds'`;
            return (
                `insert into "themes" ("id", "name", "colors", "visible", "is_default", "created_at") values (` +
                `${quote(theme.id)}, ${quote(theme.name)}, ${quote(JSON.stringify(theme.colors))}::jsonb, ` +
                `${theme.visible}, ${isDefault}, ${createdAt}` +
                `) on conflict ("id") do nothing;`
            );
        });

        // Le fichier reste sur le disque tel quel. Le déplacer ici le ferait hors de la
        // transaction : un échec plus loin dans la migration la laisserait rejouable en
        // apparence, mais sans plus rien à reprendre au second passage.
        return statements;
    }
}

type NormalizedTheme = { id: string; name: string; visible: boolean; colors: Record<string, string> };

function readCatalog(): { themes: NormalizedTheme[]; defaultId: string | null } | null {
    if (!existsSync(CONFIG_PATH)) return null;

    let raw: unknown;
    try {
        raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {
        // Un fichier illisible ne doit pas empêcher la migration : la table sera vide et le
        // Design Lab repartira de zéro, le fichier restant sur le disque pour inspection.
        return null;
    }
    if (typeof raw !== 'object' || raw === null) return null;

    const catalog = raw as FileCatalog;

    // Forme catalogue : celle en place depuis que le Design Lab gère plusieurs thèmes.
    if (Array.isArray(catalog.themes)) {
        const themes = catalog.themes
            .filter(theme => theme && theme.colors && Object.keys(theme.colors).length > 0)
            .map(theme => ({
                id: theme.id ?? randomUUID(),
                name: (theme.name ?? '').trim() || LEGACY_THEME_NAME,
                visible: theme.visible !== false,
                colors: theme.colors as Record<string, string>,
            }));
        const defaultId = themes.some(t => t.id === catalog.defaultId) ? (catalog.defaultId ?? null) : null;
        return { themes, defaultId: defaultId ?? themes[0]?.id ?? null };
    }

    // Forme ancienne : une palette unique à plat, sans nom ni identifiant. `themeStore`
    // savait déjà la promouvoir en premier thème ; on fait de même plutôt que de la perdre.
    const colors = raw as Record<string, string>;
    const usable = Object.entries(colors).filter(([, value]) => typeof value === 'string' && value.trim() !== '');
    if (usable.length === 0) return null;

    const id = randomUUID();
    return {
        themes: [{ id, name: LEGACY_THEME_NAME, visible: true, colors: Object.fromEntries(usable) }],
        defaultId: id,
    };
}

/** Littéral SQL. Les valeurs viennent d'un fichier local, mais l'échappement reste dû. */
function quote(value: string): string {
    return `'${value.replaceAll("'", "''")}'`;
}
