import { Migration } from '@mikro-orm/migrations';
import { Category as IdeaCategory } from '@contexts/idea/domain/valueObject/category';
import { Category as ProjectCategory } from '@contexts/project/domain/valueObject/category';

// La catégorie est une énumération fermée du domaine, mais la colonne est une varchar libre :
// rien n'empêchait jusqu'ici une valeur hors nomenclature, qu'aucun écran ne saurait montrer.
// Chaque contexte possède la sienne (volontairement redéclarée côté idée), donc une contrainte
// par table, bâtie sur l'énumération de son contexte.
const TABLES = [
    { table: 'projects', values: Object.values(ProjectCategory) },
    { table: 'ideas', values: Object.values(IdeaCategory) },
];

const FALLBACK = ProjectCategory.Personal;

function quoted(values: string[]): string {
    return values.map(value => `'${value}'`).join(', ');
}

export class Migration20260920000000_EnforceCategoryNomenclature extends Migration {
    override async up(): Promise<void> {
        for (const { table, values } of TABLES) {
            // Les trois formes d'une catégorie inexploitable : absente, vide, hors nomenclature.
            this.addSql(`update "${table}"
                set "category" = '${FALLBACK}'
                where "category" is null or trim("category") = '' or "category" not in (${quoted(values)});`);

            this.addSql(`alter table "${table}"
                add constraint "${table}_category_check" check ("category" in (${quoted(values)}));`);
        }
    }

    override async down(): Promise<void> {
        // Les valeurs normalisées restent : seule la contrainte se retire.
        for (const { table } of TABLES) {
            this.addSql(`alter table "${table}" drop constraint "${table}_category_check";`);
        }
    }
}
