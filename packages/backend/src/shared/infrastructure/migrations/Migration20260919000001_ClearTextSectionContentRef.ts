import { Migration } from '@mikro-orm/migrations';

export class Migration20260919000001_ClearTextSectionContentRef extends Migration {
    override async up(): Promise<void> {
        this.addSql(`update "page_layouts"
            set "sections" = (
                select coalesce(jsonb_agg(
                    case
                        when section->>'type' = 'text' and section->>'contentRef' is not null
                        then jsonb_set(section, '{contentRef}', 'null'::jsonb)
                        else section
                    end
                    order by ordinality
                ), '[]'::jsonb)
                from jsonb_array_elements("sections") with ordinality as t(section, ordinality)
            )
            where exists (
                select 1 from jsonb_array_elements("sections") as s(section)
                where section->>'type' = 'text' and section->>'contentRef' is not null
            );`);
    }

    override async down(): Promise<void> {
        // no-op
    }
}
