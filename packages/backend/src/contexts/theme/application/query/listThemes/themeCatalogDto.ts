/**
 * La forme exacte que consomment `ThemeEditorPage` et le `ThemeProvider` de shared-ui.
 * Elle n'a pas bougé en passant du fichier JSON à la base : c'est un contrat public.
 */
export type ThemeDto = Readonly<{
    id: string;
    name: string;
    visible: boolean;
    colors: Record<string, string>;
}>;

export type ThemeCatalogDto = Readonly<{
    themes: ThemeDto[];
    defaultId: string | null;
}>;
