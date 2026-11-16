export type PageDto = Readonly<{
    id: string;
    pageType: string;
    pageRef: string;
    version: number;
    referenceWidth: number;
    hasContent: boolean;
    elements: ReadonlyArray<
        Readonly<{
            id: string;
            transform: Readonly<{ x: number; y: number; w: number; h: number }>;
            components: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
        }>
    >;
}>;
