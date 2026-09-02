import { Migration } from '@mikro-orm/migrations';

// Toute URL absolue pointant vers /uploads/, quel qu'en soit le schéma ou l'hôte. La classe
// niant le guillemet borne le match à une seule valeur JSON : une URL externe qui ne
// contient pas /uploads/ n'est jamais touchée.
const ABSOLUTE_UPLOAD_URL = 'https?://[^"]*?/uploads/';

const JSONB_COLUMNS: Array<[table: string, column: string]> = [
    ['projects', 'documents'],
    ['projects', 'links'],
    ['ideas', 'documents'],
    ['ideas', 'links'],
    ['features', 'documents'],
    ['tickets', 'documents'],
    ['page_layouts', 'sections'],
];

/**
 * Les URLs de médias étaient écrites en absolu par le frontend (`FileUpload` et `DropZone`
 * préfixaient l'URL rendue par POST /uploads avec l'origine de l'API). L'origine se
 * retrouvait donc en base, dans les documents des agrégats comme dans le HTML riche des
 * sections : changer de domaine, de port ou de schéma invalidait silencieusement toutes les
 * images déjà stockées.
 *
 * La réécriture est textuelle sur le jsonb entier plutôt que champ par champ : elle attrape
 * aussi bien `"url": "http://…/uploads/x.png"` que le `src="http://…/uploads/x.png"` d'un
 * contenu texte riche.
 */
export class Migration20260901000002_RelativeUploadUrls extends Migration {
    override async up(): Promise<void> {
        for (const [table, column] of JSONB_COLUMNS) {
            this.addSql(`update "${table}"
                set "${column}" = regexp_replace("${column}"::text, '${ABSOLUTE_UPLOAD_URL}', '/uploads/', 'g')::jsonb
                where "${column}"::text ~ '${ABSOLUTE_UPLOAD_URL}';`);
        }

        this.addSql(`update "cvs"
            set "file_url" = regexp_replace("file_url", '${ABSOLUTE_UPLOAD_URL}', '/uploads/', 'g')
            where "file_url" ~ '${ABSOLUTE_UPLOAD_URL}';`);
    }

    // Irréversible : l'origine d'où venaient ces URLs n'est écrite nulle part, et la
    // remettre supposerait de deviner celle qui valait au moment de l'écriture.
    override async down(): Promise<void> {
        // no-op
    }
}
