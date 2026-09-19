export interface IOrphanUploadSweeper {
    purgeUnreferenced(olderThan: Date): Promise<string[]>;
}
