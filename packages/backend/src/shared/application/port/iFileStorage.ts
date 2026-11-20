export interface IFileStorage {
    save(extension: string, content: Buffer): Promise<string>;
    rewrite(filename: string, content: string): Promise<boolean>;
    read(filename: string): Promise<string | null>;
}
