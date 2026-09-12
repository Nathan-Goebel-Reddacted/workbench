import { ITransactionRunner } from './iTransactionRunner';

/**
 * Exécuteur de transaction pour les tests. Il ne simule pas une base : il observe la
 * *frontière*. Ce qu'on veut empêcher de régresser n'est pas le comportement de Postgres —
 * il est vérifié par ailleurs — mais qu'une écriture soit un jour ajoutée à un cas d'usage
 * en cascade **en dehors** du `run()`, où elle survivrait à l'échec des autres.
 */
export class FakeTransactionRunner implements ITransactionRunner {
    /** Nombre de transactions ouvertes. */
    started = 0;
    /** Nombre de transactions arrivées au bout sans exception. */
    committed = 0;
    /** Nombre de transactions abandonnées sur exception. */
    rolledBack = 0;
    /** `true` tant qu'un `run()` est en cours — ce que les doublures interrogent. */
    inTransaction = false;

    async run<T>(work: () => Promise<T>): Promise<T> {
        this.started++;
        this.inTransaction = true;
        try {
            const result = await work();
            this.committed++;
            return result;
        } catch (error) {
            this.rolledBack++;
            throw error;
        } finally {
            this.inTransaction = false;
        }
    }
}
