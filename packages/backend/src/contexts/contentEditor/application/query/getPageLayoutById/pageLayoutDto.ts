export type PageLayoutDto = Readonly<{
    id: string;
    pageType: string;
    pageRef: string;
    allowedSectionTypes: string[];
    gridColumns: number;
    sections: Array<{
        id: string;
        type: string;
        content: Record<string, unknown>;
        x: number;
        y: number;
        w: number;
        h: number;
    }>;
}>;
