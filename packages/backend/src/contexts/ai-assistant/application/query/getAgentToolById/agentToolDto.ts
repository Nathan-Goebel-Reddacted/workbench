export type AgentToolDto = Readonly<{
    id: string;
    userId: string;
    name: string;
    permission: string;
    scopes: string[];
}>;
