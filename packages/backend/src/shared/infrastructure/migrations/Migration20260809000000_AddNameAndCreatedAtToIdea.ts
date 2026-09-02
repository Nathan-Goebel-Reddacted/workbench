import { Migration } from '@mikro-orm/migrations';

export class Migration20260809000000_AddNameAndCreatedAtToIdea extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "ideas" add column "name" text not null;`);
        this.addSql(`alter table "ideas" add column "created_at" timestamptz not null default now();`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "ideas" drop column "created_at";`);
        this.addSql(`alter table "ideas" drop column "name";`);
    }
}
