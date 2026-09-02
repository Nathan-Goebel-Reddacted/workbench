import { Migration } from '@mikro-orm/migrations';

export class Migration20260810000000_AddContactMessages extends Migration {
    override async up(): Promise<void> {
        this.addSql(`create table "contact_messages" (
      "id" varchar(255) not null,
      "fields" jsonb not null,
      "sender_email" varchar(255) null,
      "submitted_at" timestamptz not null,
      "mail_sent" boolean not null default false,
      constraint "contact_messages_pkey" primary key ("id")
    );`);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "contact_messages" cascade;`);
    }
}
