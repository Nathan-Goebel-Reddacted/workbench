export type IdeaDto = Readonly<{
    id: string;
    description: string;
    links: Array<{ url: string; displayText: string; logo: string }>;
    documents: Array<{ id: string; name: string; url: string; type: string }>;
}>;
