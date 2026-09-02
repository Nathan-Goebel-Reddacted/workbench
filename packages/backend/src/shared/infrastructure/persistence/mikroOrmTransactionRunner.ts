import { EntityManager } from '@mikro-orm/postgresql';
import { ITransactionRunner } from '@shared/application/port/iTransactionRunner';

/**
 * `begin`/`commit` plutôt que `em.transactional`, parce que la transaction doit porter sur
 * le contexte que les dépôts utilisent déjà : `transactional` travaille sur un fork, que
 * les dépôts injectés ne verraient pas. Leurs propres `em.transactional` deviennent alors
 * des transactions imbriquées (savepoints) de celle-ci, et tombent avec elle.
 */
export class MikroOrmTransactionRunner implements ITransactionRunner {
    constructor(private readonly em: EntityManager) {}

    async run<T>(work: () => Promise<T>): Promise<T> {
        await this.em.begin();
        try {
            const result = await work();
            await this.em.commit();
            return result;
        } catch (error) {
            await this.em.rollback();
            throw error;
        }
    }
}
