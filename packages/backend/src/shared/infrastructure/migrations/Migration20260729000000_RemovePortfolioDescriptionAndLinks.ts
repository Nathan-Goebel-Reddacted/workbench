import { Migration } from '@mikro-orm/migrations';

export class Migration20260729000000_RemovePortfolioDescriptionAndLinks extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "portfolios" drop column "description";`);
        this.addSql(`alter table "portfolios" drop column "links";`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "portfolios" add column "description" text not null default '';`);
        this.addSql(`alter table "portfolios" add column "links" jsonb not null default '[]';`);
    }
}
