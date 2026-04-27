# Context : ContentEditor

## Responsabilité

Interface privée d'édition de tout le contenu public.
Ce context ne stocke pas de données propres — il orchestre les modifications
sur Portfolio, ProjectCatalog et IdeaWorkshop.

## Composants

- **ProfileEditor** — édition de la home (bio, liens, featured projects)
- **CVManager** — upload, sélection, suppression de CVs
- **GridBuilder** — construction visuelle des ProjectPages par grille de sections
- **ProjectPageEditor** — édition des métadonnées publiques d'un projet

## GridBuilder — détail

Le GridBuilder permet de :
- Créer des sections dans une ProjectPage
- Choisir le type de Block (texte, image, vidéo, code, lien, embed…)
- Organiser les sections dans une grille (colonnes, ordre)
- Prévisualiser le rendu public

## Règles métier

- Le GridBuilder modifie uniquement la ProjectPage du Portfolio
  (pas les données métier du ProjectCatalog)
- Un Block doit avoir un type déclaré — pas de contenu générique non typé
- La grille est responsive par défaut (breakpoints à définir)

## Pages associées

- `pages/private/editor.md`
- `pages/private/project-catalog.md` (section édition visuelle)
