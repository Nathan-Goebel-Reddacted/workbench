export interface IProjectPageGateway {
    projectsWithPage(projectIds: readonly string[]): Promise<ReadonlySet<string>>;
}
