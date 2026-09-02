import { Migration } from '@mikro-orm/migrations';

export class Migration20260901000000_AddUserTokenVersion extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "users" add column "token_version" int not null default 0;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "users" drop column "token_version";`);
    }
}
