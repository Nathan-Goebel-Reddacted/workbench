import { Migration } from '@mikro-orm/migrations';

export class Migration20260506081415_AddAllowedEmails extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "allowed_emails" ("email" varchar(255) not null, "created_at" timestamptz not null default now(), constraint "allowed_emails_pkey" primary key ("email"));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "allowed_emails" cascade;`);
    }
}
