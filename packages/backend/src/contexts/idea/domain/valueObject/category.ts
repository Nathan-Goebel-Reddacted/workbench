// Même vocabulaire que la catégorie d'un Project, volontairement redéclaré ici : chaque bounded
// context possède le sien, et une idée convertie transporte sa valeur vers le ProjectCatalog.
export enum Category {
    Personal = 'personal',
    Professional = 'professional',
    Academic = 'academic',
}
