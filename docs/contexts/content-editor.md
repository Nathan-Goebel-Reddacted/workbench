# Context : ContentEditor

## Responsabilité

Gérer la mise en page des pages publiques : portfolio (home) et une page par projet.
Ce context ne stocke pas le contenu lui-même — il stocke la **structure visuelle** (quelles
sections, dans quel ordre, dans quelle colonne) et une **référence** vers le champ source
dans un autre context (Portfolio ou ProjectCatalog).

## Agrégat

- **PageLayout** — mise en page d'une page publique
  - `id: PageLayoutId`
  - `pageType: PageType` (`portfolio` | `project`)
  - `pageRef: PageRef` (UUID du portfolio ou du projet concerné)
  - `sections: Section[]`

## Entité

- **Section** — élément de contenu positionné dans la grille
  - `id: SectionId`
  - `type: SectionType` (`text` | `image` | `video` | `code` | `link` | `embed`)
  - `contentRef: ContentRef` (ex: `project.title`, `portfolio.bio`)
  - `position: GridPosition` (colonne + ordre)

## Règles métier

- Un PageLayout est unique par page (`pageType` + `pageRef`)
- Une Section doit avoir un `ContentRef` valide au format `context.field`
- La colonne d'une `GridPosition` commence à 1 — l'ordre commence à 0
- Ajouter, supprimer ou déplacer une Section ne modifie pas les données sources

## Pages associées

- `pages/private/editor.md`
- `pages/private/project-catalog.md` (section édition visuelle)
