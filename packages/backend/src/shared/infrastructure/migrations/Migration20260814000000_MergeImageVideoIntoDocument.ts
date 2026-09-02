import { Migration } from '@mikro-orm/migrations';

/**
 * Fusion des sections `image` et `video` en un unique type `document`.
 *
 * Avant : la palette du grid-builder offrait deux widgets distincts, chacun avec son type de
 * section persisté. Après : un seul widget « Document », dont la forme du rendu (image, vidéo,
 * PDF, mindmap) se déduit de l'URL au moment de l'affichage — voir `resolveDocumentKind` dans
 * `@atelier/content-renderer`.
 *
 * Le `content` de chaque section est laissé intact : le widget document lit les mêmes clés
 * (`url`, `alt`, `fit`, `position`, `radius`), les sections vidéo n'en portant qu'`url`. Seul le
 * champ `type` est réécrit.
 *
 * `with ordinality` n'est pas décoratif : sans lui, `jsonb_agg` ne garantit pas l'ordre des
 * sections, et le layout serait recomposé dans un ordre arbitraire.
 */
export class Migration20260814000000_MergeImageVideoIntoDocument extends Migration {
    override async up(): Promise<void> {
        this.addSql(`
            update "page_layouts" pl
            set "sections" = s.sections
            from (
                select pl2.id,
                       jsonb_agg(
                           case
                               when elem->>'type' in ('image', 'video')
                                   then jsonb_set(elem, '{type}', '"document"'::jsonb)
                               else elem
                           end
                           order by ord
                       ) as sections
                from "page_layouts" pl2,
                     lateral jsonb_array_elements(pl2."sections") with ordinality as t(elem, ord)
                where pl2."sections" @> '[{"type": "image"}]'::jsonb
                   or pl2."sections" @> '[{"type": "video"}]'::jsonb
                group by pl2.id
            ) s
            where pl.id = s.id;
        `);
    }

    /**
     * Le retour est asymétrique par nature : `document` ne dit plus si la section était une image
     * ou une vidéo. Le type est redérivé de l'URL — embeds YouTube/Vimeo et extensions vidéo
     * donnent `video`, tout le reste `image`.
     *
     * Conséquence assumée : une section créée après cette migration et pointant un PDF ou un
     * mindmap redescendra en `image`, type sous lequel l'ancien renderer ne saura pas l'afficher.
     * Ces formes n'existaient pas avant la fusion, il n'y a pas d'état antérieur à restaurer.
     */
    override async down(): Promise<void> {
        this.addSql(`
            update "page_layouts" pl
            set "sections" = s.sections
            from (
                select pl2.id,
                       jsonb_agg(
                           case
                               when elem->>'type' = 'document'
                                   then jsonb_set(
                                       elem,
                                       '{type}',
                                       case
                                           when lower(coalesce(elem->'content'->>'url', '')) ~
                                                '(youtube\\.com|youtu\\.be|vimeo\\.com)'
                                             or lower(coalesce(elem->'content'->>'url', '')) ~
                                                '\\.(mp4|m4v|webm|ogv|ogg|mov|mkv|avi|wmv|flv|mpeg|mpg|3gp|ts)(\\?|$)'
                                               then '"video"'::jsonb
                                           else '"image"'::jsonb
                                       end
                                   )
                               else elem
                           end
                           order by ord
                       ) as sections
                from "page_layouts" pl2,
                     lateral jsonb_array_elements(pl2."sections") with ordinality as t(elem, ord)
                where pl2."sections" @> '[{"type": "document"}]'::jsonb
                group by pl2.id
            ) s
            where pl.id = s.id;
        `);
    }
}
