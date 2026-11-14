---
status: accepted
---

# Éditeur de pages en ECS (Element / Component / System)

Les pages éditables (accueil du portfolio, pages projet) étaient composées de widgets typés
(`SectionType`) posés sur une grille de cellules. Deux rigidités en découlaient : un placement et
un redimensionnement contraints au pas de la grille, et des propriétés (rayon, fond, cliquabilité)
dupliquées ou enfermées dans un widget dédié (`BACKGROUND`, `LINK_AREA`). On remplace ce modèle
par une composition ECS : une page est un ensemble d'**Elements** à plat ; un Element n'a pas de
type, il porte des **Components** (`Transform`, `Surface`, `Link`, un contenu…) ; des **Systems**
traitent tous les Elements qui portent un Component donné (rendu, inspecteur, validation, layout
mobile).

## Considered Options

- **Garder les widgets, remplacer seulement la grille par des coordonnées libres** : règle le
  placement mais garde la duplication et oblige à créer un nouveau widget pour chaque
  combinaison (image cliquable, code sur fond sombre…).
- **ECS sur tout le projet** : écarté. Project, Ticket, Idea, Portfolio sont des agrégats DDD dont
  les invariants sont métier ; les dissoudre en Components perdrait ces règles. L'ECS est limité
  au contexte content-editor.
- **Elements hiérarchiques (parent/enfant)** : écarté pour l'instant. Rien ne dépend de ce qui
  repose sur quoi : chaque Element se règle seul. Un Component `Parent` pourra être ajouté plus
  tard sans toucher aux Elements qui ne le portent pas.
- **Coordonnées en pourcentage** : écartées, la hauteur ne pouvant suivre la largeur sans
  déformation.
- **Une disposition par dimension d'écran (à la Framer)** : écartée. Chaque Element devrait être
  placé dans chaque dimension, par l'utilisateur comme par un agent MCP.

## Consequences

### Modèle

- L'entité ECS s'appelle **Element** et non *Entity*, pour ne pas entrer en collision avec
  l'Entity du DDD dans le même contexte.
- Un Component n'est pas une valeur primitive : il regroupe ses réglages (un `Text` porte sa
  couleur, une `Surface` sa couleur de fond et sa bordure).
- Un Element porte au plus un contenu, et aucun contenu ne gère de disposition interne : une
  image légendée, ce sont deux Elements.
- Les combinaisons de Components interdites sont refusées par le backend ; le front ne fait que
  les refléter. Première règle : `Link` est interdit sur un contenu déjà interactif
  (`ContactForm`, `Embed`, `LinkList`).
- Aucune règle ne dépend du type de Page : tous les contenus, `ProjectCard` compris, sont
  utilisables sur l'accueil comme sur une page projet.

### Couleurs

- Une couleur se choisit parmi les variables du thème ou en valeur libre ; une valeur libre est
  une donnée de contenu, elle ne suit pas un changement de thème. Par défaut, toute couleur vaut
  une variable du thème.
- Portent une couleur : `Text`, `Surface`, `LinkList`, `ContactForm`. `Code` garde le thème de
  sa coloration syntaxique. Dans un `Text`, des mots colorés dans le texte riche priment
  localement sur la couleur du Component.
- Une couleur ou une URL venues des données ne sont jamais recopiées telles quelles dans la
  page : elles passent par une forme validée (variable du thème ou hexadécimal ; URL http(s) ou
  chemin interne), ce qui ferme l'injection de CSS et les liens `javascript:`.
- Plus d'inversion automatique du thème sur un fond sombre : la lisibilité d'un texte posé sur
  une Surface se règle à la main, par sa couleur. La notion « posé sur » disparaît du rendu.

### Rendu desktop

- Le `Transform` s'exprime en pixels sur une largeur de référence de 1440 px : l'éditeur montre
  exactement ce qui est publié. Au-dessus, la Page reste à 1440 px et se centre ; entre 1024 et
  1440 px, elle est réduite proportionnellement ; sous 1024 px, elle est empilée.
- La hauteur de la Page suit l'Element le plus bas, plus une marge fixe.
- L'ordre d'affichage est explicite et réglé par l'utilisateur, sans couches calculées : une
  zone cliquable placée devant un texte lui prend ses clics. Cet ordre est la position de
  l'Element dans la Page, pas un champ du `Transform` : avancer ou reculer échange deux voisins,
  et deux Elements ne peuvent pas partager un rang.
- L'ordre du document (tabulation, lecteurs d'écran, référencement) suit l'ordre de lecture —
  les mêmes rangées que l'empilement mobile —, indépendamment de l'ordre d'affichage.
- Un `Link` ou une `ProjectCard` vers un projet suit la destination du projet : sa page, son URL
  externe, ou rien s'il n'en a pas.
- Rien ne bouge sans que l'utilisateur l'ait déplacé : un contenu plus grand que sa boîte est
  coupé, jamais agrandi d'office.
- Une référence cassée (projet supprimé ou privé, fichier disparu) masque l'Element ou désactive
  son `Link` sur le site public. C'est le backend qui en décide en construisant la Page publique ;
  le front public n'applique aucune règle.

### Rendu mobile (sous 1024 px)

- Les Elements sont empilés automatiquement ; il n'y a pas de disposition mobile éditée à la
  main.
- L'ordre d'empilement regroupe en rangées les Elements dont les hauteurs se recouvrent sur plus
  de la moitié de la plus petite, puis lit les rangées de haut en bas et de gauche à droite.
- Un Element empilé prend toute la largeur. Un contenu textuel (`Text`, `LinkList`,
  `ContactForm`, `Code`) prend la hauteur de ce qu'il affiche et garde une taille de texte
  lisible ; un contenu visuel garde la proportion de sa boîte desktop.
- Un Element sans contenu (fond, zone cliquable) n'existe que par ce qu'il recouvre : il est
  masqué.
- Si l'empilement déçoit, un Component `MobileTransform` permettra d'éditer la disposition
  mobile sans casser le reste.

### Édition

- Un Element se crée vide (son seul `Transform`) ; ses Components s'ajoutent depuis
  l'inspecteur. Dupliquer copie tous ses Components.
- Chaque opération (ajout, déplacement, redimensionnement, pose ou retrait d'un Component,
  suppression) est une commande enregistrée aussitôt, sans brouillon. La dernière écriture
  gagne, y compris entre l'éditeur et un agent MCP — mais seulement sur un même Element : la
  Page étant enregistrée d'un bloc, une commande dont la Page a changé entre-temps est rejouée
  sur la version à jour, pour qu'une modification d'un autre Element ne soit jamais perdue.
- L'éditeur prévisualise les dimensions d'écran courantes sans les rendre éditables.
- Sans grille, l'éditeur aide à l'alignement par magnétisme (bords et centres des autres
  Elements, centre de la Page) et par un pas fin de 8 px, désactivables pendant le glisser. Ce
  sont des aides d'interface : le `Transform` reste en pixels libres.
- Un contenu coupé, une référence cassée : l'éditeur les signale sur l'Element et en alerte au
  niveau de la Page.
- Les outils MCP de mise en page sont réécrits autour des Elements et des Components
  (`add_element`, `set_component`, `remove_component`…) ; les outils par section disparaissent.

### Migration

- Les pages existantes ne sont pas migrées : elles sont supprimées et recomposées. Les données
  des projets ne sont pas touchées ; les fichiers propres à l'éditeur, référencés seulement par
  ces pages, sont supprimés avec elles.
- La recomposition se fait en prod, site fermé : rien de ce qui est composé hors prod n'y est
  transporté, un import de base complet écrasant les données des projets.
