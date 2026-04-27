# ADR-005 : Système de grille pour les ProjectPages

**Date** : 2026-04-20
**Statut** : `accepté`
**Projet** : Atelier Portfolio

## Contexte

Les pages projet publiques sont construites librement via un GridBuilder.
Chaque Block peut occuper plusieurs colonnes et rangées, comme un dashboard.
Il faut choisir le système de grille sous-jacent et le nombre de colonnes de référence.

## Options considérées

- **CSS Grid natif + positionnement manuel** — contrôle total, pas de dépendance.
  Mais le GridBuilder doit implémenter toute la logique de placement et de collision.
- **react-grid-layout** — librairie React éprouvée pour les dashboards libres.
  Drag & drop, redimensionnement, gestion des collisions, responsive intégré.
- **Grille fixe par "sections"** — chaque section est une rangée pleine, ordonnées verticalement.
  Plus simple, mais ne permet pas le positionnement libre côté colonnes.

## Décision

**react-grid-layout avec une grille à 12 colonnes.**

`react-grid-layout` couvre le besoin exact : positionnement libre des Blocks sur une grille
de type dashboard, drag & drop dans le GridBuilder, responsive configurable par breakpoint.

**Paramètres retenus :**
- Colonnes : `12` (standard dashboard, divisions en 1/2/3/4/6/12 naturelles)
- Hauteur d'une rangée : à calibrer selon le design (ex: 80px)
- Breakpoints responsive :
  - `lg` ≥ 1200px — 12 colonnes (pleine grille)
  - `md` ≥ 996px — 10 colonnes
  - `sm` ≥ 768px — 6 colonnes
  - `xs` < 768px — 1 colonne (empilement vertical dans l'ordre de la grille)

## Conséquences

- Dépendance à `react-grid-layout` (MIT, maintenu activement)
- Le layout de chaque ProjectPage est sérialisé en JSON (tableau de positions `{i, x, y, w, h}`)
  et stocké en base côté ContentEditor
- Le rendu public utilise la version statique (`<GridLayout>` sans drag) — pas de dépendance
  au mode édition en production
- Le GridBuilder (espace privé) utilise la version interactive (`<GridLayout>` avec drag & drop)
- Sur mobile (xs), tous les Blocks passent en colonne unique, triés par position `y` puis `x`
