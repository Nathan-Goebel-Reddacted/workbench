export interface IMindmapStorage {
    store(content: unknown): Promise<string>;
}
