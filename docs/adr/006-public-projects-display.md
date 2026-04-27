# ADR-006 : Affichage des projets sur la home publique

**Date** : 2026-04-19 (révisé 2026-04-20)
**Statut** : `accepté`
**Projet** : Atelier Portfolio

## Contexte

La page d'accueil publique affiche une liste de projets. La question était :
faut-il une sélection manuelle dédiée (concept "FeaturedProjects"), ou simplement
exposer les projets marqués comme publics ?

## Options considérées

- **FeaturedProjects** — sélection manuelle distincte du flag de visibilité. Permet de
  choisir quels projets publics apparaissent sur la home, indépendamment du flag `public`.
- **Tous les projets `public = true`** — la home affiche automatiquement tous les projets
  visibles. La curation se fait uniquement via le toggle visibilité et l'ordre drag & drop.

## Décision

**Tous les projets avec `public = true` sont affichés sur la home, sans sélection manuelle additionnelle.**

La visibilité de chaque projet se contrôle via un toggle `public` / `privé` accessible depuis :
- l'Editor (liste avec drag & drop)
- la fiche projet dans le ProjectCatalog

L'ordre d'affichage sur la home est défini par drag & drop depuis l'Editor.
Il n'existe pas de concept distinct de "FeaturedProjects".

## Conséquences

- Pas de règle métier supplémentaire à maintenir — un seul flag `public` suffit
- L'Editor expose la liste de tous les projets avec toggle visibilité + drag & drop pour l'ordre
- Le design de la grille home doit gérer proprement de 1 à N projets
- Aucun impact domaine si le nombre de projets publics croît
