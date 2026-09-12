/**
 * Le domaine sait qu'un secret est conservé haché et jamais en clair ; il ne sait pas avec
 * quoi. L'algorithme, son coût et sa bibliothèque sont des choix d'infrastructure, qui
 * changent au rythme de l'état de l'art et non à celui des règles métier.
 */
export interface ISecretHasher {
    hash(secret: string): Promise<string>;

    matches(candidate: string, hashed: string): Promise<boolean>;
}
