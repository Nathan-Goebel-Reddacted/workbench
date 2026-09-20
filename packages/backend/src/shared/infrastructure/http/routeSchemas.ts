/**
 * Schémas de route partagés par plusieurs contextes.
 *
 * Un `:id` descend jusqu'à une colonne `uuid` : sans validation, Postgres refuse lui-même
 * toute autre forme et la route rend un 500. Sur une route ouverte, n'importe qui remplit
 * alors le journal d'erreurs. Validé ici, le refus devient un 400 qui ne se journalise pas.
 */
export const uuidParamsSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
    },
};
