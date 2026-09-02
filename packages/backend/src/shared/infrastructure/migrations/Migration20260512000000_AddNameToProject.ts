import { Migration } from '@mikro-orm/migrations';

export class Migration20260512000000_AddNameToProject extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "projects" add column "name" varchar(255) not null default '';`);
        this.addSql(`alter table "projects" alter column "name" drop default;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "projects" drop column "name";`);
    }
}
