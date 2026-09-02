export type TicketDto = Readonly<{
    id: string;
    /** Référence complète `4.8.23`. */
    reference: string;
    featureId: string;
    title: string;
    description: string;
    status: string;
    /**
     * Le statut est-il verrouillé sur `pending` ? Vrai quand la feature est portée par une idée.
     * Exposé pour que l'interface grise le contrôle au lieu de laisser tenter puis échouer.
     */
    statusLocked: boolean;
    notes: string[];
    documents: Array<{ id: string; name: string; url: string; type: string }>;
}>;
