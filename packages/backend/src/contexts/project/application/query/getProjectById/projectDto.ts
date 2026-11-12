import { ProjectDestination } from '../projectDestination';

export type ProjectDto = Readonly<{
    id: string;
    /** Numéro de porteur, premier segment des références de ses tickets. */
    number: number;
    /** Identifiant lisible : `4`. */
    reference: string;
    name: string;
    description: string;
    visible: boolean;
    category: string;
    destination: ProjectDestination;
    links: Array<{ url: string; displayText: string; logo: string; replacesPage: boolean }>;
    documents: Array<{ id: string; name: string; url: string; type: string }>;
}>;
