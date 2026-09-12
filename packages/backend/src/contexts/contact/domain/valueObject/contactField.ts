/** Un champ répondu du formulaire, avec l'intitulé qu'il portait sur la page. */
export type ContactField = Readonly<{ label: string; value: string }>;

/**
 * Un champ tel qu'il arrive du formulaire : il porte en plus le type que l'éditeur lui a
 * donné, qui sert à repérer l'adresse de réponse. Ce type ne survit pas à la soumission —
 * seuls l'intitulé et la valeur sont conservés.
 */
export type SubmittedField = Readonly<{ label: string; value: string; type?: string }>;

/** Ne garde que ce que le visiteur a réellement rempli. */
export function answeredOnly(fields: readonly SubmittedField[]): ContactField[] {
    return (fields ?? [])
        .filter(field => (field?.value ?? '').trim() !== '')
        .map(field => ({ label: field.label, value: field.value }));
}
