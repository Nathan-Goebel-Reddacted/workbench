import { Migration } from '@mikro-orm/migrations';

export class Migration20260822000000_AddCvs extends Migration {
    override async up(): Promise<void> {
        this.addSql(`create table "cvs" (
      "id" uuid not null,
      "name" text not null,
      "file_url" text not null,
      "visible" boolean not null default true,
      "display_order" int not null,
      "created_at" timestamptz not null,
      constraint "cvs_pkey" primary key ("id")
    );`);
        this.addSql(`create index "cvs_display_order_index" on "cvs" ("display_order");`);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "cvs" cascade;`);
    }
}
