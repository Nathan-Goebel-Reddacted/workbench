export type TicketDto = Readonly<{
    id: string;
    reference: string;
    featureId: string;
    title: string;
    description: string;
    status: string;
    notes: string[];
    documents: Array<{ id: string; name: string; url: string; type: string }>;
}>;
