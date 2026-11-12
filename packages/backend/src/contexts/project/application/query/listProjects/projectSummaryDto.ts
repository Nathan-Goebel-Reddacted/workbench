import { ProjectDestination } from '../projectDestination';

export type ProjectSummaryDto = Readonly<{
    id: string;
    number: number;
    reference: string;
    name: string;
    description: string;
    visible: boolean;
    category: string;
    destination: ProjectDestination;
}>;
