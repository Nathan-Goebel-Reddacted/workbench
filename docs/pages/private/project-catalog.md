# Page : Project Catalog (privé)

## Objectif

Gérer les projets réels : documentation, features, tickets, et rendu public.

## Sections

### 1. Liste des projets

- Cartes projets : nom, logo, stack (tags), statut (`en cours` / `shipped` / `archivé`)
- Filtres : statut, tags
- Indicateur de visibilité publique (`public` / `privé`)
- Bouton "Nouveau projet"

### 2. Fiche projet

Métadonnées :
- Nom, logo, description longue
- Stack (tags multi-sélection)
- Statut : `en cours` / `shipped` / `archivé`
- Liens : repo GitHub, démo live, npm, documentation externe
- Visibilité : toggle `public` / `privé` (contrôle l'apparition dans le Portfolio public)
- Lien vers l'Idea d'origine (si le projet est issu d'une conversion)

### 3. Features & Tickets

#### Numérotation

- Chaque Feature reçoit un numéro à 4 chiffres attribué à la création (`0001`, `0002`… `0022`)
- Chaque Ticket est numéroté sous sa Feature : `XXXX.Y` (ex: `0022.3`)
- Numéros de Feature réservés :
  - `0000` — tickets hors-feature (changements cosmétiques, divers)
  - D'autres numéros réservés peuvent être définis selon les besoins du projet

#### Interface Features

- Liste des features avec leur numéro et titre
- Ajouter une feature (titre + description libre)
- Développer une feature → affiche ses tickets

#### Interface Tickets

- Liste des tickets d'une feature : `XXXX.Y — titre`
- Ajouter un ticket à une feature (titre + description libre)
- Ajouter un ticket hors-feature (rattaché à `0000`)
- Pas de statut — un ticket existe ou il est supprimé

### 4. ADR (Architecture Decision Records)

- Liste des ADR du projet (titre, date, statut)
- Créer un nouvel ADR depuis le template
- Éditer un ADR existant (texte libre structuré)

### 5. Éditeur de page publique (GridBuilder)

- Accès au GridBuilder pour construire la ProjectPage publique
- Sections disponibles : ajout, réordonnement, suppression
- Types de Block : `text`, `image`, `video`, `code`, `link`, `embed`
- Prévisualisation du rendu public

### 6. ProjectContext IA

Génération d'une fiche structurée injectable dans un agent IA :
- Nom et description du projet
- Stack (tags)
- Liste des features et leurs tickets
- Liens (repo, démo)

Le contexte est généré à la demande — il n'est pas stocké en continu.
