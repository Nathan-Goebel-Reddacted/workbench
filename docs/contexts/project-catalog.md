# Context : ProjectCatalog

## Responsabilité

Gérer les projets réels : leur cycle de vie, leur documentation technique,
leurs features et tickets.

## Agrégats

- **Project** — entité centrale : nom, logo, description, stack (Tags), statut, liens, documents
- **Feature** — fonctionnalité d'un projet, avec description et état, documents
- **Ticket** — tâche concrète rattachée à une Feature ou directement au Project, documents
- **ADR** — décision d'architecture documentée, rattachée à un Project

## Documents

`Project`, `Feature` et `Ticket` peuvent chacun porter une liste de **Document** (entité enfant, sans repository propre).

- Types acceptés : `pdf`, `image`, `video`
- Persisté en colonne JSONB sur la table de l'agrégat parent
- Identifié par un `DocumentId` (UUID) — permet l'ajout et la suppression ciblée

## Statuts d'un Project

```
en cours → shipped → archivé
```

## Règles métier

- Un Project peut exister sans Feature ni Ticket
- Un Ticket est toujours rattaché à un Project (via Feature ou directement)
- Les Tags sont partagés et servent aussi au filtrage public
- Un Project peut être lié à une Idea (IdeaWorkshop) dont il est issu
- Un Project peut exposer un ProjectContext aux agents IA (AIAssistant)

## Pages associées

- `pages/private/project-catalog.md`
- `pages/public/project.md` (lecture)

## Dépendances

- Fournit des données à **Portfolio** (nom, logo, stack, statut)
- Expose des **ProjectContext** à **AIAssistant**
- Peut recevoir des données pré-remplies depuis **AIAssistant** (STT / agents)
