/** Ce que le contexte Ticket a besoin de savoir de sa feature — rien de plus. */
export type FeatureContext = Readonly<{
    /** `project` ou `idea` : c'est lui qui décide si le ticket a le droit d'avancer. */
    ownerType: string;
    ownerNumber: number;
    featureNumber: number;
}>;

/**
 * Un ticket ne lit pas la table des features : il pose sa question au contexte Feature, qui
 * interroge lui-même le porteur. La chaîne est Ticket → Feature → (Project | Idea).
 */
export interface IFeatureGateway {
    describe(featureId: string): Promise<FeatureContext | null>;
}
