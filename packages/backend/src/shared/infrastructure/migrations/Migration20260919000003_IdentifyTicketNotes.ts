import { Migration } from '@mikro-orm/migrations';

export class Migration20260919000003_IdentifyTicketNotes extends Migration {
    override async up(): Promise<void> {
        this.addSql(`update "tickets"
            set "notes" = (
                select jsonb_agg(
                    jsonb_build_object('id', gen_random_uuid(), 'text', note #>> '{}')
                    order by ordinality
                )
                from jsonb_array_elements("notes"::jsonb) with ordinality as t(note, ordinality)
            )
            where jsonb_array_length("notes"::jsonb) > 0
              and jsonb_typeof("notes"::jsonb -> 0) = 'string';`);
    }

    override async down(): Promise<void> {
        this.addSql(`update "tickets"
            set "notes" = (
                select jsonb_agg(note -> 'text' order by ordinality)
                from jsonb_array_elements("notes"::jsonb) with ordinality as t(note, ordinality)
            )
            where jsonb_array_length("notes"::jsonb) > 0
              and jsonb_typeof("notes"::jsonb -> 0) = 'object';`);
    }
}
