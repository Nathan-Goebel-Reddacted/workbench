# ADR-004 : Visibilité des projets entre Portfolio et ProjectCatalog

**Date** : 2026-04-19
**Statut** : `accepté`
**Projet** : Atelier Portfolio

## Contexte

Le projet distingue une partie publique (Portfolio) et une partie privée (ProjectCatalog + édition).
La question est : comment Portfolio accède-t-il aux données des projets, et comment la visibilité est-elle contrôlée ?

Deux interprétations étaient possibles :
- Portfolio et ProjectCatalog sont deux sources de données distinctes (complexité de synchronisation)
- Portfolio est une vue filtrée des données du ProjectCatalog (une seule source de vérité)

## Options considérées

- **Source de données séparée** — Portfolio possède ses propres entités dupliquées depuis ProjectCatalog. Découplage fort mais synchronisation nécessaire.
- **Vue filtrée sur ProjectCatalog** — un flag `visible` (ou équivalent) sur chaque Project détermine si le projet apparaît côté public. Portfolio lit directement les données de ProjectCatalog.
- **Projection / read model** — ProjectCatalog publie des événements, Portfolio construit son propre read model. Over-engineering pour ce cas d'usage.

## Décision

**Vue filtrée : un champ `public` sur Project contrôle la visibilité.**

Un Project avec `public = true` est accessible depuis le Portfolio public (liste, page détail).
Un Project avec `public = false` reste visible uniquement dans l'espace privé.

Le Portfolio ne stocke aucune donnée propre — il interroge le ProjectCatalog en filtrant sur `public = true`.
L'édition de la visibilité se fait depuis l'espace privé (ContentEditor / ProjectCatalog).

## Conséquences

- Source de vérité unique : pas de risque de désynchronisation
- La ProjectPage publique est une vue des données du ProjectCatalog, complétée par le GridLayout (ContentEditor)
- Un projet peut exister en privé (en cours, brouillon) avant d'être rendu public
- La suppression d'un projet en prive le retire automatiquement du Portfolio public
