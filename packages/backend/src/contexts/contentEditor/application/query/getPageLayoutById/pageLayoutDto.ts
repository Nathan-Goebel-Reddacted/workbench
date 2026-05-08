export type PageLayoutDto = Readonly<{
    id: string;
    pageType: string;
    pageRef: string;
    sections: Array<{
        id: string;
        type: string;
        contentRef: string;
        column: number;
        order: number;
    }>;
}>;
