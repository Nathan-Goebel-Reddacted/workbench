import { Migration } from '@mikro-orm/migrations';

export class Migration20260920000001_ProjectLinkReplacesPage extends Migration {
    override async up(): Promise<void> {
        this.addSql(`update "projects"
            set "links" = (
                select coalesce(jsonb_agg(jsonb_build_object('replacesPage', false) || link), '[]'::jsonb)
                from jsonb_array_elements("links") as link
            )
            where "links" is not null
              and jsonb_typeof("links") = 'array'
              and jsonb_array_length("links") > 0;`);
    }

    override async down(): Promise<void> {
        this.addSql(`update "projects"
            set "links" = (
                select coalesce(jsonb_agg(link - 'replacesPage'), '[]'::jsonb)
                from jsonb_array_elements("links") as link
            )
            where "links" is not null
              and jsonb_typeof("links") = 'array'
              and jsonb_array_length("links") > 0;`);
    }
}
