import { Migration } from '@mikro-orm/migrations';

export class Migration20261101000000_AddSiteAccess extends Migration {
    override async up(): Promise<void> {
        this.addSql(`create table "site_access" (
      "id" text not null,
      "open" boolean not null,
      constraint "site_access_pkey" primary key ("id")
    );`);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "site_access" cascade;`);
    }
}
