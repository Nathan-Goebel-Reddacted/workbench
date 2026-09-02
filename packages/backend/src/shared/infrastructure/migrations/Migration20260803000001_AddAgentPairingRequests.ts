import { Migration } from '@mikro-orm/migrations';

export class Migration20260803000001_AddAgentPairingRequests extends Migration {
    override async up(): Promise<void> {
        this.addSql(`create table "agent_pairing_requests" (
      "id" uuid not null,
      "name" varchar(255) not null,
      "requested_scopes" jsonb not null default '[]',
      "requested_permission" varchar(255) not null,
      "code_hash" varchar(255) not null,
      "code_prefix" varchar(255) not null,
      "status" varchar(255) not null default 'pending',
      "agent_tool_id" uuid null,
      "expires_at" timestamptz not null,
      "created_at" timestamptz not null default NOW(),
      constraint "agent_pairing_requests_pkey" primary key ("id")
    );`);
        this.addSql(
            `create index "agent_pairing_requests_code_prefix_index" on "agent_pairing_requests" ("code_prefix");`,
        );
        this.addSql(`create index "agent_pairing_requests_status_index" on "agent_pairing_requests" ("status");`);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "agent_pairing_requests" cascade;`);
    }
}
