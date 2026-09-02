import { Migration } from '@mikro-orm/migrations';

export class Migration20260901000001_ProjectDefaultsHidden extends Migration {
    // La factory impose `visible = false` — « un projet naît privé » — mais la colonne
    // portait `default true` depuis sa création : toute insertion hors du chemin
    // applicatif produisait un projet publié. Les lignes existantes ne bougent pas, seul
    // le défaut change.
    override async up(): Promise<void> {
        this.addSql(`alter table "projects" alter column "visible" set default false;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "projects" alter column "visible" set default true;`);
    }
}
