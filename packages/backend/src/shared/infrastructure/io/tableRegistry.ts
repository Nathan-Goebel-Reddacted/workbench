import { MikroORM } from '@mikro-orm/postgresql';

export type IoTable = {
    tableName: string;
    primaryKeys: string[];
    columns: string[];
};

// La table de suivi des migrations décrit l'état du schéma de la base cible, pas les données
// du domaine : la transporter ferait croire à une base qu'elle a joué des migrations qu'elle
// n'a pas jouées.
const EXCLUDED_TABLES = new Set(['mikro_orm_migrations']);

// Dériver la liste des tables des métadonnées plutôt que de l'énumérer à la main est ce qui
// fait que l'import/export couvre tous les bounded contexts sans entretien : une nouvelle
// entité y entre dès qu'elle est déclarée.
export function collectIoTables(orm: MikroORM): IoTable[] {
    return Object.values(orm.getMetadata().getAll())
        .filter(meta => !meta.abstract && !meta.embeddable && !meta.virtual && meta.tableName)
        .filter(meta => !EXCLUDED_TABLES.has(meta.tableName))
        .map(meta => {
            // fieldNames porte le nom de colonne SQL réel, que la stratégie de nommage dérive
            // du nom de propriété (createdAt -> created_at). Les propriétés calculées et les
            // relations inverses n'ont pas de colonne : elles sortent ici.
            const columns = Object.values(meta.properties)
                .filter(prop => prop.persist !== false)
                .filter(prop => prop.fieldNames?.length === 1)
                .map(prop => prop.fieldNames[0]);

            const primaryKeys = meta.primaryKeys
                .map(pk => meta.properties[pk]?.fieldNames?.[0])
                .filter((name): name is string => Boolean(name));

            return {
                tableName: meta.tableName,
                primaryKeys,
                columns: [...new Set(columns)],
            };
        })
        .filter(table => table.primaryKeys.length > 0 && table.columns.length > 0)
        .sort((a, b) => a.tableName.localeCompare(b.tableName));
}
