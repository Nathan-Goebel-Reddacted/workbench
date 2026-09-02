import { Migration } from '@mikro-orm/migrations';

/**
 * Le widget « Liens » naissait avec `contentRef = 'portfolio.links'` ou `'project.links'`,
 * une liaison qui n'a jamais été résolue nulle part. Le renderer court-circuite toute
 * section porteuse d'un contentRef et ne rend rien en mode public : ces sections étaient
 * donc invisibles sur le site, y compris les liens saisis à la main dans l'éditeur.
 *
 * Le widget ne pose plus de contentRef ; les sections déjà enregistrées doivent perdre le
 * leur, sinon elles restent muettes.
 */
export class Migration20260901000003_ClearLinkSectionContentRef extends Migration {
    override async up(): Promise<void> {
        this.addSql(`update "page_layouts"
            set "sections" = (
                select coalesce(jsonb_agg(
                    case
                        when section->>'type' = 'link'
                         and section->>'contentRef' in ('portfolio.links', 'project.links')
                        then jsonb_set(section, '{contentRef}', 'null'::jsonb)
                        else section
                    end
                    order by ordinality
                ), '[]'::jsonb)
                from jsonb_array_elements("sections") with ordinality as t(section, ordinality)
            )
            where "sections"::text like '%.links%';`);
    }

    // Restaurer la liaison rétablirait des sections muettes : la remise en arrière n'a
    // d'intérêt que si la résolution des contentRef est un jour implémentée.
    override async down(): Promise<void> {
        // no-op
    }
}
