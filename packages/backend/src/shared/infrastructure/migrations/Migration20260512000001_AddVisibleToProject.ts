import { Migration } from '@mikro-orm/migrations';

export class Migration20260512000001_AddVisibleToProject extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "projects" add column "visible" boolean not null default true;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "projects" drop column "visible";`);
    }
}
