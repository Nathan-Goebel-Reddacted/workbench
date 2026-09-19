export interface IUserDirectory {
    displayNames(): Promise<ReadonlyMap<string, string>>;
}
