export type MediaImageDto = Readonly<{
    id: string;
    name: string;
    url: string;
}>;

export type TicketImagesDto = Readonly<{
    ticketId: string;
    reference: string;
    title: string;
    images: MediaImageDto[];
}>;

export type FeatureImagesDto = Readonly<{
    featureId: string;
    featureName: string;
    images: MediaImageDto[];
    tickets: TicketImagesDto[];
}>;

export type ProjectImagesDto = Readonly<{
    projectId: string;
    projectName: string;
    images: MediaImageDto[];
    features: FeatureImagesDto[];
}>;
