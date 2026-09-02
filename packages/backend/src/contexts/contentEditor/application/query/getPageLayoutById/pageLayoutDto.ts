export type PageLayoutDto = Readonly<{
    id: string;
    pageType: string;
    pageRef: string;
    sections: Array<{
        id: string;
        type: string;
        contentRef: string | null;
        content: Record<string, unknown>;
        x: number;
        y: number;
        w: number;
        h: number;
    }>;
}>;
