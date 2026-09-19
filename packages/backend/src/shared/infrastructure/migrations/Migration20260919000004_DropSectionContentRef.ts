import { Migration } from '@mikro-orm/migrations';

export class Migration20260919000004_DropSectionContentRef extends Migration {
    override async up(): Promise<void> {
        this.addSql(`update "page_layouts"
            set "sections" = (
                select coalesce(jsonb_agg(section - 'contentRef' order by ordinality), '[]'::jsonb)
                from jsonb_array_elements("sections") with ordinality as t(section, ordinality)
            )
            where exists (
                select 1 from jsonb_array_elements("sections") as s(section)
                where section ? 'contentRef'
            );`);
    }

    override async down(): Promise<void> {
        // no-op
    }
}
