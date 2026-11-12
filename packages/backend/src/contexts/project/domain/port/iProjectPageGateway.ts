export interface IProjectPageGateway {
    hasSections(projectId: string): Promise<boolean>;
}
