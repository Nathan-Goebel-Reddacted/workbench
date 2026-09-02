import { Migration } from '@mikro-orm/migrations';

export class Migration20260523000000_AddCategoryToProject extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "projects" add column "category" varchar(50) not null default 'personal';`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "projects" drop column "category";`);
    }
}
