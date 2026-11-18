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
- **Chaque disposition mise à l'échelle de la largeur de la fenêtre** (seuils 1024 / 600,
  facteur ≈ 0,71 à 1,6) : retenu le 2026-11-17, écarté le 2026-11-18 en composant l'accueil. Le
  texte rétrécissait avec la disposition : à 1024 px, un surtitre de 13 px de la maquette en
  rendait 9, et la règle de lisibilité imposait ≥ 16 px en desktop. Les largeurs deviennent des
  minimums, rendus au pixel.
- **Un empilement automatique sous 1024 px, sans disposition éditée** : retenu le 2026-11-13
  « pour démarrer », écarté le 2026-11-17 en composant l'accueil. Les rangées de lecture du
  desktop ne disent ni ce qu'on veut voir en premier sur un téléphone, ni ce qu'on y masque, ni
  quelle taille garder à une image ; la mise en page d'une version mobile est un choix, pas un
  calcul. Révision : une disposition par taille d'écran (voir § Disposition par taille d'écran).

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
  (`ContactForm`, `Embed`).
- Aucune règle ne dépend du type de Page : tous les contenus sont utilisables sur l'accueil
  comme sur une page projet.
- Pas de contenu composé (révision 2026-11-17) : une carte de projet, une liste de liens, une
  rangée d'images ou une pastille se composent d'Elements libres (`Surface`, `Text`, `Media`,
  `Link`). `ProjectCard`, `LinkList` et `Carousel`, hérités de la grille, sont retirés ; une Page
  qui en porte encore se charge sans eux.

### Couleurs

- Une couleur se choisit parmi les variables du thème ou en valeur libre ; une valeur libre est
  une donnée de contenu, elle ne suit pas un changement de thème. Par défaut, toute couleur vaut
  une variable du thème.
- Portent une couleur : `Text`, `Surface`, `ContactForm`. `Code` garde le thème de
  sa coloration syntaxique. Dans un `Text`, des mots colorés dans le texte riche priment
  localement sur la couleur du Component.
- Une couleur ou une URL venues des données ne sont jamais recopiées telles quelles dans la
  page : elles passent par une forme validée (variable du thème ou hexadécimal ; URL http(s) ou
  chemin interne), ce qui ferme l'injection de CSS et les liens `javascript:`.
- Plus d'inversion automatique du thème sur un fond sombre : la lisibilité d'un texte posé sur
  une Surface se règle à la main, par sa couleur. La notion « posé sur » disparaît du rendu.

### Rendu desktop

- Le `Transform` s'exprime en pixels sur la largeur de sa taille d'écran (desktop 1280 px) :
  l'éditeur montre exactement ce qui est publié. Au-dessus de sa largeur, la Page se centre.
- La hauteur de la Page suit l'Element le plus bas, plus une marge fixe.
- L'ordre d'affichage est explicite et réglé par l'utilisateur, sans couches calculées : une
  zone cliquable placée devant un texte lui prend ses clics. Cet ordre est la position de
  l'Element dans la Page, pas un champ du `Transform` : avancer ou reculer échange deux voisins,
  et deux Elements ne peuvent pas partager un rang.
- L'ordre du document (tabulation, lecteurs d'écran, référencement) suit l'ordre de lecture —
  les rangées de la taille affichée, de haut en bas puis de gauche à droite —, indépendamment de
  l'ordre d'affichage.
- Un `Link` vers un projet suit la destination du projet : sa page, son URL externe, ou rien
  s'il n'en a pas. Un projet privé ou supprimé neutralise le lien sans masquer l'Element : une
  carte de projet composée d'Elements libres reste affichée, inerte.
- Rien ne bouge sans que l'utilisateur l'ait déplacé : un contenu plus grand que sa boîte est
  coupé, jamais agrandi d'office.
- Une référence cassée (projet supprimé ou privé, fichier disparu) masque l'Element ou désactive
  son `Link` sur le site public. C'est le backend qui en décide en construisant la Page publique ;
  le front public n'applique aucune règle.

### Disposition par taille d'écran (révision 2026-11-17, largeurs 2026-11-18)

- Trois tailles d'écran : desktop 1280 px, tablette 768 px, mobile 360 px. Chaque Element porte
  une **disposition** : un placement par taille (un `Transform` borné par la largeur de sa taille,
  et un drapeau « masqué »), toujours complète. Hauteur maximale : 20 000 px en desktop,
  40 000 px en tablette, 80 000 px en mobile, où les Elements s'empilent.
- Chaque largeur est un **minimum**. Rendu public par seuils de largeur de fenêtre : desktop dès
  1280 px, tablette de 768 à 1279 px, mobile sous 768 px. Chaque disposition est rendue à sa
  largeur, au pixel, et se centre au-dessus ; les marges latérales prennent le fond du site (un
  fond pleine largeur s'arrête au bord de la disposition). Seule une fenêtre plus étroite que le
  mobile réduit la disposition mobile à l'échelle. Les seuils vivent dans le domaine backend et
  passent par le DTO.
- La taille d'un Text est donc celle rendue à l'écran. Elle se règle par taille d'écran ;
  tablette et mobile se calculent depuis le desktop (rapport des largeurs, plancher 15 / 14 px)
  puis se retouchent. L'éditeur signale un Text réglé sous 11 px dans une taille où il est
  affiché.
- Un placement stocké hors des bornes de sa taille (Page composée avec d'anciennes largeurs) est
  ramené dans la largeur à la lecture, jamais refusé.
- Masquer garde la boîte. Un Element masqué ne compte ni dans la hauteur ni dans l'ordre de
  lecture de sa taille ; masqué dans les trois tailles, son contenu ne publie plus de page projet.
- Composer le desktop d'abord : un Element se crée pleine largeur (gouttière 16 px) en bas de la
  tablette et du mobile ; son premier contenu y fixe sa hauteur à partir de sa boîte desktop
  (visuel : proportion gardée ; texte : reflux à police inchangée), sans toucher x, y, w. C'est
  une approximation : l'alerte « contenu coupé » par taille sert de filet.
- Régénérer la tablette ou le mobile depuis le desktop (commande de Page) relit les rangées du
  desktop et les empile pleine largeur ; elle écrase toute retouche de cette taille. Un Element
  masqué en desktop va en fin de pile, masqué. Un fond (Element sans contenu) n'a pas de règle de
  groupe : il reçoit le calcul générique et se redéfinit à la main.
- Une commande de placement ou de masquage nomme toujours sa taille (sans défaut) ; seuls les
  outils MCP prennent le desktop par défaut.

### Édition

- Un Element se crée vide (sa seule disposition) ; ses Components s'ajoutent depuis
  l'inspecteur. Dupliquer copie tous ses Components et décale chaque placement de 20 px.
- Chaque opération (ajout, déplacement, redimensionnement, pose ou retrait d'un Component,
  suppression) est une commande enregistrée aussitôt, sans brouillon. La dernière écriture
  gagne, y compris entre l'éditeur et un agent MCP — mais seulement sur un même Element : la
  Page étant enregistrée d'un bloc, une commande dont la Page a changé entre-temps est rejouée
  sur la version à jour, pour qu'une modification d'un autre Element ne soit jamais perdue.
- L'éditeur dispose chaque taille d'écran à la main, et la régénère depuis le desktop.
- Sans grille, l'éditeur aide à l'alignement par magnétisme (bords et centres des autres
  Elements, centre de la Page) et par un pas fin de 8 px, désactivables pendant le glisser. Ce
  sont des aides d'interface : le `Transform` reste en pixels libres.
- Un contenu coupé, une référence cassée : l'éditeur les signale sur l'Element et en alerte au
  niveau de la Page.
- Les outils MCP de mise en page sont réécrits autour des Elements et des Components
  (`add_element`, `set_component`, `remove_component`…) ; les outils par section disparaissent.

### Migration

- Les Pages composées avant la disposition par taille (develop, jamais déployé) sont vidées par
  une migration, sans convertisseur.
- Les pages existantes ne sont pas migrées : elles sont supprimées et recomposées. Les données
  des projets ne sont pas touchées ; les fichiers propres à l'éditeur, référencés seulement par
  ces pages, sont supprimés avec elles.
- La recomposition se fait en prod, site fermé : rien de ce qui est composé hors prod n'y est
  transporté, un import de base complet écrasant les données des projets.
