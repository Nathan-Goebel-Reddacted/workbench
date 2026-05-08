export type FeatureDto = Readonly<{
    id: string;
    projectId: string;
    name: string;
    description: string;
    documents: Array<{ id: string; name: string; url: string; type: string }>;
}>;
