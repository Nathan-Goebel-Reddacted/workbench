# Context : Portfolio

## Responsabilité

Tout ce qui est visible publiquement. Ce context est en lecture seule côté public.
L'écriture appartient au ContentEditor.

## Agrégats

- **Profile** — bio, liens (GitHub, npm, contact…), compétences
- **CV** — liste de PDFs, sélection active
- **ProjectPage** — page publique d'un projet, composée d'un GridLayout

## Règles métier

- Un seul CV peut être "actif" à la fois (affiché par défaut dans le sélecteur)
- Une ProjectPage doit avoir au minimum un titre et un MediaBanner
- Les projets affichés sur la home sont tous ceux avec `public = true`, dans l'ordre défini par drag & drop depuis l'Editor
- Les Sections d'une ProjectPage sont ordonnées et configurables via GridLayout

## Pages associées

- `pages/public/home.md`
- `pages/public/cv.md`
- `pages/public/project.md`

## Dépendances

- Lit les données de **ProjectCatalog** (nom, logo, stack, statut)
- Le rendu des ProjectPage est défini par **ContentEditor** (GridBuilder)
