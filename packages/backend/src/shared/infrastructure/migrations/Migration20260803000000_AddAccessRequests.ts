import { Migration } from '@mikro-orm/migrations';

export class Migration20260803000000_AddAccessRequests extends Migration {
    override async up(): Promise<void> {
        this.addSql(`create table "access_requests" (
      "email" varchar(255) not null,
      "display_name" varchar(255) not null,
      "status" varchar(255) not null default 'pending',
      "created_at" timestamptz not null default NOW(),
      "updated_at" timestamptz not null default NOW(),
      constraint "access_requests_pkey" primary key ("email")
    );`);
        this.addSql(`create index "access_requests_status_index" on "access_requests" ("status");`);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "access_requests" cascade;`);
    }
}
