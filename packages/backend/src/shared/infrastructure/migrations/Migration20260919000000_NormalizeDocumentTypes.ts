import { Migration } from '@mikro-orm/migrations';
import {
    DocumentType,
    IMAGE_EXTENSIONS,
    MINDMAP_SUFFIX,
    VIDEO_EXTENSIONS,
} from '@shared/domain/valueObject/documentType';

const TABLES = ['projects', 'ideas', 'features', 'tickets'];

const PATH = `lower(split_part(d->>'url', '?', 1))`;

const TYPE_FROM_URL = `case
    when ${PATH} like '%${MINDMAP_SUFFIX}' then '${DocumentType.MINDMAP}'
    when ${PATH} ~ '\\.pdf$' then '${DocumentType.PDF}'
    when ${PATH} ~ '\\.(${IMAGE_EXTENSIONS.join('|')})$' then '${DocumentType.IMAGE}'
    when ${PATH} ~ '\\.(${VIDEO_EXTENSIONS.join('|')})$' then '${DocumentType.VIDEO}'
    else '${DocumentType.FILE}'
end`;

export class Migration20260919000000_NormalizeDocumentTypes extends Migration {
    override async up(): Promise<void> {
        for (const table of TABLES) {
            this.addSql(`update "${table}"
                set "documents" = (
                    select jsonb_agg(d || jsonb_build_object('type', ${TYPE_FROM_URL}) order by position)
                    from jsonb_array_elements("documents"::jsonb) with ordinality as e(d, position)
                )
                where jsonb_array_length("documents"::jsonb) > 0;`);
        }
    }

    override async down(): Promise<void> {
        // no-op
    }
}
