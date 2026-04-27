# Page : Home (public)

## Objectif

Présentation personnelle et liste complète des projets publics.
C'est l'unique page publique d'entrée — elle concentre le profil et le portfolio.

## Header (global)

Présent sur toutes les pages publiques :
- Nom / logo du site à gauche
- Navigation à droite : Home, CV

## Sections

### 1. Hero / Présentation

- Nom, titre / poste
- Bio courte
- Liens : GitHub, LinkedIn, npm, email, site personnel

### 2. Projets publics

- Grille de tous les projets avec `public = true`
- Par projet : logo + nom
- Cliquable → redirige vers la ProjectPage publique du projet
- Pas de pagination — tous les projets publics sont affichés

## Notes

- Tous les projets avec `public = true` apparaissent — pas de sélection manuelle additionnelle
- La visibilité (toggle `public` / `privé`) se gère depuis l'Editor ou la fiche projet du ProjectCatalog
- L'ordre d'affichage est défini par drag & drop depuis l'Editor
