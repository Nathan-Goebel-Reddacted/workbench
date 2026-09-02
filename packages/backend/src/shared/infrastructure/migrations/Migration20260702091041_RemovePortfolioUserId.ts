import { Migration } from '@mikro-orm/migrations';

export class Migration20260702091041_RemovePortfolioUserId extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "portfolios" drop constraint "portfolios_user_id_unique";`);
        this.addSql(`alter table "portfolios" drop column "user_id";`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "portfolios" add column "user_id" uuid not null;`);
        this.addSql(`alter table "portfolios" add constraint "portfolios_user_id_unique" unique ("user_id");`);
    }
}
