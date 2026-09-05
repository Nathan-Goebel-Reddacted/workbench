import { Migration } from '@mikro-orm/migrations';

export class Migration20260905000000_AddErrorLog extends Migration {
    override async up(): Promise<void> {
        this.addSql(`create table "error_log_entries" (
      "id" varchar(255) not null,
      "origin" varchar(16) not null,
      "message" text not null,
      "stack" text null,
      "url" varchar(500) null,
      "user_id" varchar(255) null,
      "correlation_id" varchar(255) null,
      "context" jsonb not null,
      "occurred_at" timestamptz not null,
      constraint "error_log_entries_pkey" primary key ("id")
    );`);
        this.addSql(`create index "error_log_entries_occurred_at_index" on "error_log_entries" ("occurred_at");`);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "error_log_entries" cascade;`);
    }
}
