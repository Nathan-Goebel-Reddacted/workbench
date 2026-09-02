export type IdeaSummaryDto = Readonly<{
    id: string;
    number: number;
    reference: string;
    name: string;
    description: string;
    createdAt: string;
    category: string;
}>;
