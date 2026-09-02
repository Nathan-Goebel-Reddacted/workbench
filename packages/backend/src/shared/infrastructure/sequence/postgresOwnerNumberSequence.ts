import { EntityManager } from '@mikro-orm/postgresql';
import { IOwnerNumberSequence } from '@shared/domain/port/iOwnerNumberSequence';

/** Nom de la séquence en base — créée par migration, jamais par le code applicatif. */
export const OWNER_NUMBER_SEQUENCE = 'owner_number_seq';

/**
 * `nextval` est atomique et ne verrouille rien : deux créations simultanées ne peuvent pas obtenir
 * le même numéro. En contrepartie une transaction annulée consomme quand même le sien — c'est le
 * comportement attendu, un numéro n'est jamais réattribué.
 */
export class PostgresOwnerNumberSequence implements IOwnerNumberSequence {
    constructor(private readonly em: EntityManager) {}

    async next(): Promise<number> {
        const [row] = await this.em
            .getConnection()
            .execute<Array<{ nextval: string }>>(`select nextval('${OWNER_NUMBER_SEQUENCE}')`);
        return Number(row.nextval);
    }
}
