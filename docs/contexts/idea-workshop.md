# Context : IdeaWorkshop

## Responsabilité

Espace de réflexion et de théorisation pour les projets non démarrés,
et journal de bord pour les projets actifs.

## Agrégats

- **Idea** — concept non démarré : titre, description libre, tags, mindmaps liées, devlog
- **Mindmap** — carte mentale, liée à une Idea ou un Project
- **DevLog** — entrées chronologiques de journal (texte libre, horodaté)

## Règles métier

- Une Idea peut être convertie en Project (ProjectCatalog) — elle ne disparaît pas, elle est liée
- Une Mindmap peut être liée à une Idea OU à un Project, pas les deux à la fois
- Un DevLog appartient à une Idea ou un Project
- Les entrées DevLog peuvent être créées par saisie vocale (AIAssistant)

## Pages associées

- `pages/private/idea-workshop.md`

## Dépendances

- Peut alimenter **ProjectCatalog** (conversion Idea → Project)
- Reçoit des entrées depuis **AIAssistant** (STT, agents)
