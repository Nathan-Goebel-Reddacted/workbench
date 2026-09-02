import { Migration } from '@mikro-orm/migrations';

/**
 * Références hiérarchiques et features polymorphes.
 *
 * Avant : une feature appartenait à un projet, et la référence d'un ticket était un compteur
 * global annuel (`2026.12`) — le préfixe étant l'année fabriquée côté navigateur, deux tickets de
 * features différentes se suivaient dans la même suite.
 *
 * Après : une feature est portée par un projet **ou** une idée, projets et idées partagent une
 * même suite de numéros, et un ticket porte `[porteur].[feature].[ticket]` — `4.8.23` —
 * chaque segment repartant à 1 dans son parent.
 *
 * Ordre des opérations, dans lequel rien ne peut être interverti :
 *   colonnes nullables → contrainte d'unicité retirée → remplissage porteur puis feature puis
 *   ticket → contraintes reposées → séquence positionnée sur le dernier numéro attribué.
 */
export class Migration20260813000000_HierarchicalReferences extends Migration {
    override async up(): Promise<void> {
        // ── Séquence partagée par les projets et les idées ────────────────────────────────
        // C'est elle qui permet à une idée convertie de garder son numéro, donc à la conversion
        // de ne réécrire aucune référence de ticket.
        this.addSql(`create sequence if not exists "owner_number_seq" start with 1 increment by 1;`);

        // ── Colonnes, d'abord nullables : elles seront remplies plus bas ──────────────────
        this.addSql(`alter table "projects" add column if not exists "number" int null;`);
        this.addSql(`alter table "ideas" add column if not exists "number" int null;`);
        this.addSql(`alter table "ideas" add column if not exists "category" varchar(50) not null default 'personal';`);
        this.addSql(`alter table "features" add column if not exists "owner_type" varchar(20) null;`);
        this.addSql(`alter table "features" add column if not exists "owner_id" uuid null;`);
        this.addSql(`alter table "features" add column if not exists "number" int null;`);
        this.addSql(`alter table "tickets" add column if not exists "number" int null;`);

        // ── Garde-fou ────────────────────────────────────────────────────────────────────
        // Un ticket sans feature ne peut recevoir aucune référence valide, et une feature sans
        // porteur non plus. Il n'y en a aucun aujourd'hui : si cela change, mieux vaut échouer
        // ici que produire des références fausses.
        this.addSql(`
            do $$
            declare orphan_tickets int; declare orphan_features int;
            begin
                select count(*) into orphan_tickets
                  from tickets t left join features f on f.id = t.feature_id where f.id is null;
                if orphan_tickets > 0 then
                    raise exception 'Migration stopped: % orphan ticket(s) must be dealt with first', orphan_tickets;
                end if;

                -- Seulement si l'on part bien de l'ancien schéma : rejouée, la migration a déjà
                -- remplacé project_id par le couple (owner_type, owner_id).
                if exists (select 1 from information_schema.columns
                           where table_name = 'features' and column_name = 'project_id') then
                    select count(*) into orphan_features
                      from features fe left join projects p on p.id = fe.project_id where p.id is null;
                    if orphan_features > 0 then
                        raise exception 'Migration stopped: % orphan feature(s) must be dealt with first', orphan_features;
                    end if;
                end if;
            end $$;
        `);

        // ── La contrainte d'unicité doit tomber avant la renumérotation ───────────────────
        // Un UPDATE de masse croise forcément des valeurs déjà prises en cours de route.
        this.addSql(`alter table "tickets" drop constraint if exists "tickets_reference_unique";`);

        // ── Numéros de porteurs ──────────────────────────────────────────────────────────
        // Les projets d'abord, par nom ; les idées ensuite, par date de création — seule colonne
        // temporelle disponible. Aucune table n'ayant de date de création avant celle-ci, cet
        // ordre est conventionnel : il vaut surtout d'être déterministe et rejouable.
        this.addSql(`
            update "projects" p set "number" = s.rn
            from (select id, row_number() over (order by name, id) as rn from "projects") s
            where p.id = s.id and p."number" is null;
        `);
        this.addSql(`
            update "ideas" i set "number" = s.rn + coalesce((select max("number") from "projects"), 0)
            from (select id, row_number() over (order by created_at, id) as rn from "ideas") s
            where i.id = s.id and i."number" is null;
        `);

        // ── Porteur des features : toutes appartiennent aujourd'hui à un projet ───────────
        this.addSql(`update "features" set "owner_type" = 'project' where "owner_type" is null;`);
        this.addSql(`
            do $$
            begin
                if exists (select 1 from information_schema.columns
                           where table_name = 'features' and column_name = 'project_id') then
                    update "features" set "owner_id" = "project_id" where "owner_id" is null;
                end if;
            end $$;
        `);

        // ── Numéros de features, relatifs à leur porteur ──────────────────────────────────
        this.addSql(`
            update "features" f set "number" = s.rn
            from (
                select id, row_number() over (partition by owner_type, owner_id order by name, id) as rn
                from "features"
            ) s
            where f.id = s.id and f."number" is null;
        `);

        // ── Numéros de tickets, relatifs à leur feature ───────────────────────────────────
        // L'ordre suit la position actuelle (`2026.<n>`), seule trace d'antériorité disponible.
        this.addSql(`
            update "tickets" t set "number" = s.rn
            from (
                select id,
                       row_number() over (
                           partition by feature_id
                           order by coalesce(nullif(split_part(reference, '.', 2), '')::int, 0), id
                       ) as rn
                from "tickets"
            ) s
            where t.id = s.id and t."number" is null;
        `);

        // ── Références complètes ─────────────────────────────────────────────────────────
        this.addSql(`
            update "tickets" t
            set reference = o.owner_number::text || '.' || f."number"::text || '.' || t."number"::text
            from "features" f
            join (
                select id, "number" as owner_number, 'project' as owner_type from "projects"
                union all
                select id, "number" as owner_number, 'idea' as owner_type from "ideas"
            ) o on o.id = f.owner_id and o.owner_type = f.owner_type
            where f.id = t.feature_id;
        `);

        // ── Contraintes, une fois les données saines ──────────────────────────────────────
        this.addSql(`alter table "projects" alter column "number" set not null;`);
        this.addSql(`alter table "ideas" alter column "number" set not null;`);
        this.addSql(`alter table "features" alter column "owner_type" set not null;`);
        this.addSql(`alter table "features" alter column "owner_id" set not null;`);
        this.addSql(`alter table "features" alter column "number" set not null;`);
        this.addSql(`alter table "tickets" alter column "number" set not null;`);

        this.addSql(`alter table "projects" add constraint "projects_number_unique" unique ("number");`);
        this.addSql(`alter table "ideas" add constraint "ideas_number_unique" unique ("number");`);
        this.addSql(`alter table "tickets" add constraint "tickets_reference_unique" unique ("reference");`);
        this.addSql(
            `alter table "features" add constraint "features_owner_number_unique" unique ("owner_type", "owner_id", "number");`,
        );
        this.addSql(
            `alter table "tickets" add constraint "tickets_feature_number_unique" unique ("feature_id", "number");`,
        );

        this.addSql(`create index if not exists "features_owner_id_index" on "features" ("owner_id");`);

        // `project_id` est remplacé par le couple (owner_type, owner_id).
        this.addSql(`alter table "features" drop column if exists "project_id";`);

        // ── La séquence reprend après le dernier numéro attribué ──────────────────────────
        // Sans cela, la première création après migration repartirait de 1 et collisionnerait.
        this.addSql(`
            select setval('owner_number_seq', greatest(
                coalesce((select max("number") from "projects"), 0),
                coalesce((select max("number") from "ideas"), 0),
                1
            ));
        `);
    }

    override async down(): Promise<void> {
        // Les anciennes références (`2026.<n>`) ne sont pas conservées : elles ne peuvent pas être
        // reconstruites. Ce down remet la structure d'avant, pas les valeurs d'avant.
        this.addSql(`alter table "features" add column if not exists "project_id" uuid null;`);
        this.addSql(`update "features" set "project_id" = "owner_id" where "owner_type" = 'project';`);
        this.addSql(`delete from "features" where "owner_type" = 'idea';`);
        this.addSql(`alter table "features" alter column "project_id" set not null;`);

        this.addSql(`alter table "tickets" drop constraint if exists "tickets_feature_number_unique";`);
        this.addSql(`alter table "features" drop constraint if exists "features_owner_number_unique";`);
        this.addSql(`alter table "projects" drop constraint if exists "projects_number_unique";`);
        this.addSql(`alter table "ideas" drop constraint if exists "ideas_number_unique";`);

        this.addSql(`alter table "tickets" drop column if exists "number";`);
        this.addSql(`alter table "features" drop column if exists "number";`);
        this.addSql(`alter table "features" drop column if exists "owner_id";`);
        this.addSql(`alter table "features" drop column if exists "owner_type";`);
        this.addSql(`alter table "ideas" drop column if exists "category";`);
        this.addSql(`alter table "ideas" drop column if exists "number";`);
        this.addSql(`alter table "projects" drop column if exists "number";`);

        this.addSql(`drop sequence if exists "owner_number_seq";`);
    }
}
