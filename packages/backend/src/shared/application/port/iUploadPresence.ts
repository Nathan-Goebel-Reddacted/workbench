/** Quels fichiers uploadés, parmi ceux qu'une donnée cite, n'existent plus sur le disque. */
export interface IUploadPresence {
    missing(urls: readonly string[]): Promise<ReadonlySet<string>>;
}
