import { Migration } from '@mikro-orm/migrations';

export class Migration20261118000000_DropPagesBeforeLayout extends Migration {
    override async up(): Promise<void> {
        this.addSql(`delete from "pages";`);
    }

    override async down(): Promise<void> {}
}
