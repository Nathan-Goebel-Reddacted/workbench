import { Migration } from '@mikro-orm/migrations';

export class Migration20260919000002_ClampSectionsToGrid extends Migration {
    override async up(): Promise<void> {
        this.addSql(`update "page_layouts"
            set "sections" = (
                select coalesce(jsonb_agg(
                    case
                        when (section->>'x')::int + (section->>'w')::int > 12
                        then section || jsonb_build_object(
                            'x', least((section->>'x')::int, 11),
                            'w', least((section->>'w')::int, 12 - least((section->>'x')::int, 11))
                        )
                        else section
                    end
                    order by ordinality
                ), '[]'::jsonb)
                from jsonb_array_elements("sections") with ordinality as t(section, ordinality)
            )
            where exists (
                select 1 from jsonb_array_elements("sections") as s(section)
                where (section->>'x')::int + (section->>'w')::int > 12
            );`);
    }

    override async down(): Promise<void> {
        // no-op
    }
}
