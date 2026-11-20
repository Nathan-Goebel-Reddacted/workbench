import { Migration } from '@mikro-orm/migrations';

export class Migration20261114203821_AddPages extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "pages" ("id" uuid not null, "page_type" varchar(255) not null, "page_ref" uuid not null, "elements" jsonb not null, "version" int not null, constraint "pages_pkey" primary key ("id"));`,
        );
        this.addSql(
            `alter table "pages" add constraint "pages_page_type_page_ref_unique" unique ("page_type", "page_ref");`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "pages" cascade;`);
    }
}
