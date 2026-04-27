# ADR-002 : Intégration MindMeister

**Date** : 2026-04-19
**Statut** : `accepté`
**Projet** : Atelier Portfolio

## Contexte

Le projet inclut la possibilité d'associer des schémas visuels (mindmaps) à des Ideas et des Projects.
Plutôt que de développer un éditeur de mindmap maison, l'option d'intégrer MindMeister a été évaluée.
L'espace privé dispose d'un système d'authentification — seul l'auteur accède aux fonctionnalités d'édition.

## Options considérées

- **Embed API** — intégrer l'éditeur MindMeister directement dans l'interface via iframe embarqué. L'utilisateur connecte son compte MindMeister une fois via OAuth 2.0, puis crée et édite ses maps sans quitter l'app.
- **REST API seule** — accès programmatique aux maps (lecture, création, mise à jour) sans éditeur embarqué. Nécessite de construire une UI de visualisation côté app.
- **Alternative open-source** — outil type draw.io / Excalidraw hébergé soi-même. Pas de dépendance externe, mais coût de maintenance.

## Décision

**Embed API en priorité, REST API en complément si nécessaire.**

L'Embed API couvre le besoin principal : créer et éditer des mindmaps dans l'interface privée sans développer d'éditeur. La connexion OAuth est faite une seule fois pour l'unique utilisateur.

La REST API reste disponible pour un usage futur par les agents IA (ex: créer automatiquement une map depuis une Idea via AIAssistant).

## Conséquences

- Dépendance à MindMeister (service tiers, compte requis, potentiel coût selon le plan)
- Les maps sont stockées sur les serveurs MindMeister, pas dans l'app
- L'accès offline aux mindmaps n'est pas possible
- La REST API devra être intégrée si les AgentTools ont besoin de lire ou créer des maps
