import { Migration } from '@mikro-orm/migrations';

export class Migration20260804080000_AddAgentToolLifecycle extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "agent_tools" add column "created_at" timestamptz not null default now();`);
        this.addSql(`alter table "agent_tools" add column "revoked_at" timestamptz null;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "agent_tools" drop column "revoked_at";`);
        this.addSql(`alter table "agent_tools" drop column "created_at";`);
    }
}
