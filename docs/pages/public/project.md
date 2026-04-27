# Page : Project (public)

## Objectif

Présenter un projet en détail au visiteur.

## Header (global)

Présent sur toutes les pages publiques :
- Nom / logo du site à gauche
- Navigation à droite : Home, CV

## Structure fixe (haut de page)

### 1. En-tête projet

- Nom du projet, logo, statut, stack (tags)

### 2. MediaBanner

- Carousel de médias : schémas, screenshots, vidéos de démo
- Défilement automatique + navigation manuelle (flèches)
- Obligatoire — toute ProjectPage doit en avoir un

### 3. Liens rapides

- Repo GitHub, démo live, npm, documentation externe, etc.

## Structure modulaire (GridLayout)

Après la partie fixe, le contenu est composé librement via le GridBuilder.

### Principe de la grille

Grille fine à N colonnes (nombre défini en ADR-005) sur laquelle chaque Block est positionné librement.
Un Block peut occuper plusieurs colonnes et plusieurs rangées — comme un dashboard.
L'organisation est entièrement libre : pas de notion de "section rigide".

### Types de Block disponibles (liste non exhaustive)

- `text` — paragraphe de texte enrichi
- `image` — image avec légende
- `video` — embed ou fichier
- `code` — bloc de code avec coloration syntaxique
- `link` — carte de lien avec description
- `embed` — iframe / widget externe (MindMeister, démo…)

### Comportement responsive

- Desktop : affichage pleine grille
- Mobile : tous les blocks passent en colonne unique, dans l'ordre de leur position sur la grille

## Notes

- Le contenu modulaire est entièrement géré par le GridBuilder (ContentEditor)
- Les métadonnées (nom, logo, stack, liens) viennent du ProjectCatalog
