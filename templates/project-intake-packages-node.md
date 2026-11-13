# Fiche projet — import Workbench

> **Pour l'instance Claude qui remplit cette fiche**
>
> Tu travailles dans le dépôt d'un projet. Ton rôle : décrire ce projet pour qu'il soit importé
> dans Workbench (le portfolio de son auteur). Tu ne modifies rien dans le dépôt : tu lis et tu remplis.
>
> 1. Explore le dépôt : README, manifestes (`package.json`, `composer.json`, `pyproject.toml`…),
>    structure des dossiers, historique git (`git log --oneline`, premier et dernier commit), docs, TODO.
> 2. Remplis le bloc YAML ci-dessous. Respecte les contraintes de chaque champ : elles reflètent
>    les règles du serveur, une valeur hors contrainte sera rejetée à l'import.
> 3. N'invente rien. Une information introuvable reste vide et va dans `questions` — l'auteur répondra.
> 4. Rends la fiche complète (ce fichier, rempli) en un seul bloc, sans commentaire autour.

```yaml
project:
  # Titre affiché. Obligatoire, 255 caractères max.
  name: "packages-node — bibliothèques React/TypeScript"

  # personal | professional | academic
  # professional = fait dans le cadre d'un emploi ou pour un client ; academic = école / formation.
  category: personal

  # Texte brut (pas de Markdown), en français : le site public est francophone.
  # 3 à 8 phrases : le problème, ce que fait le projet, comment (stack, choix marquants), où il en est.
  description: |
    Monorepo npm qui regroupe des bibliothèques TypeScript réutilisables, extraites de projets personnels pour ne plus recopier les mêmes briques d'un projet à l'autre. Il publie trois packages : action-result (pattern Result avec raisons d'erreur typées), react-hooks (hooks génériques : chargement asynchrone, taille d'élément, clic extérieur, piège de focus, verrouillage du scroll, pile d'overlays, plein écran, installation PWA) et react-ui (kit d'interface thémable). react-ui fournit un système de thèmes à variables CSS avec persistance locale ou HTTP, une vingtaine de composants (Button, Modal, Drawer, Tabs, Table, Pagination, Tooltip, DropdownMenu, Accordion…) et des toasts groupés capables d'intercepter fetch pour afficher les erreurs REST ou GraphQL. Choix marquants : styles injectés via des sélecteurs :where() à spécificité nulle pour que le projet consommateur garde toujours la main, des classes rui-* utilisables sur les éléments HTML natifs, aucune couleur métier dans le package et Floating UI pour le positionnement. La publication passe par un script qui ordonne les packages selon leurs dépendances et ne publie que les versions absentes du registre. Les trois packages sont publiés sur npm (react-ui 0.4.0, react-hooks 0.3.0, action-result 0.1.0) ; seuls Combobox et DatePicker restent en attente.

  # Proposition seulement : un projet naît privé, l'auteur décide de la publication.
  suggestPublish: false

  # Liens externes. url = URL absolue valide (https://…).
  # logo optionnel : chemin ou URL finissant par .png .jpg .jpeg .svg .webp, sinon laisser vide.
  # replacesPage: true si ce lien doit remplacer la page projet (ex. site en ligne) — au plus UN lien.
  links:
    - url: "https://www.npmjs.com/package/@-reddacted-/react-ui"
      displayText: "react-ui sur npm"
      logo: ""
      replacesPage: false
    - url: "https://www.npmjs.com/package/@-reddacted-/react-hooks"
      displayText: "react-hooks sur npm"
      logo: ""
      replacesPage: false
    - url: "https://www.npmjs.com/package/@-reddacted-/action-result"
      displayText: "action-result sur npm"
      logo: ""
      replacesPage: false

  # Fichiers déjà hébergés en ligne (pdf, image, vidéo) : Workbench enregistre une URL, il n'uploade rien.
  # Un fichier seulement présent dans le dépôt va dans `localFiles`, pas ici.
  documents: []

  # Fichiers du dépôt qui mériteraient d'être joints (captures, diagrammes, rapport…), chemin relatif.
  localFiles: []

# Découpage du travail. Une feature = un bloc fonctionnel cohérent (ex. "Authentification",
# "Export PDF"), pas un fichier ni une couche technique. Vise 3 à 10 features.
# Les tickets décrivent le travail réel : déduits du code, des commits, des TODO, des issues.
# status : finished (fait et en place) | in_progress (commencé, incomplet) | pending (prévu, pas commencé)
features:
  - name: "Pattern Result typé (action-result)"
    description: "Petit package qui représente le résultat d'une action métier : succès avec message, ou liste de raisons d'échec identifiées par un code."
    tickets:
      - title: "Classes ActionResult et Reason"
        description: "Accumulation chaînable de raisons (addReason), isSuccess, recherche par code, formatage des raisons en texte. Publié en 0.1.0."
        status: finished

  - name: "Hooks React génériques (react-hooks)"
    description: "Hooks sans dépendance d'interface, réutilisés par react-ui et réexportés par lui."
    tickets:
      - title: "Hooks utilitaires"
        description: "useAsync (statut de chargement), useElementSize, useClickOutside, useEscapeKey, useDocumentTitle, useValueChange."
        status: finished
      - title: "Hooks navigateur"
        description: "useFullscreen et useInstallPrompt (invite d'installation PWA)."
        status: finished
      - title: "Hooks d'overlay"
        description: "useFocusTrap, useScrollLock et useOverlayStack, extraits du comportement de Modal pour être partagés avec Drawer et les menus."
        status: finished

  - name: "Système de thèmes"
    description: "Thèmes définis par des variables CSS (--color-x / --color-on-x), sélection et édition côté utilisateur, persistance interchangeable."
    tickets:
      - title: "ThemeProvider et ThemeSelect"
        description: "Contexte de thème, palette par défaut, injection des variables et du CSS des classes rui-*."
        status: finished
      - title: "Stores de thèmes local et HTTP"
        description: "createLocalThemeStore et createHttpThemeStore derrière une interface ThemeStore commune."
        status: finished
      - title: "Édition des couleurs"
        description: "ColorPicker et ColorField (react-colorful), copier/coller d'une palette via le presse-papiers, génération de couleur aléatoire."
        status: finished

  - name: "Infrastructure de style et classes natives"
    description: "Socle CSS partagé par tous les composants : styles injectés en <style>, sélecteurs :where(), classes rui-* applicables aux éléments HTML natifs."
    tickets:
      - title: "Infra de style"
        description: "Injection des feuilles de style, résolution des couleurs (\"--x\" → var(--x), sinon valeur brute), modèle repris de NavBar."
        status: finished
      - title: "Classe rui-input"
        description: "Style commun pour texte, textarea, select, checkbox, radio et switch ; absorbe les tickets Select et Checkbox/Switch/RadioGroup prévus initialement."
        status: finished
      - title: "Button forme × couleur"
        description: "Variantes de forme combinées à une prop color issue du thème, retrait des couleurs « danger » codées en dur."
        status: finished

  - name: "Composants d'interface"
    description: "Kit de composants React thémables, chacun existant aussi sous forme de classe rui-* quand c'est pertinent."
    tickets:
      - title: "Modal et Drawer"
        description: "Modal migré sur les hooks d'overlay ; Drawer avec côtés et modes, pilotable impérativement (openDrawer, closeDrawer, toggleDrawer)."
        status: finished
      - title: "Éléments simples"
        description: "Spinner, Skeleton, Card, Stack, Badge, Tag."
        status: finished
      - title: "Navigation et structure"
        description: "Tabs, Accordion sur <details> natif, Pagination avec saut de page, classe Breadcrumb, NavBar réécrite en conteneur à children avec état actif via aria-current."
        status: finished
      - title: "Table"
        description: "Classe rui-table et composant Table avec colonnes typées et tri."
        status: finished
      - title: "PageStatus"
        description: "Composant générique d'état de page qui remplace PageMessage, LoadingMessage et ErrorMessage."
        status: finished
      - title: "Combobox et DatePicker"
        description: "En attente ; couverture native en attendant via input type=\"date\" et input list + datalist stylés par rui-input."
        status: pending

  - name: "Overlays positionnés"
    description: "Éléments flottants ancrés à un déclencheur, positionnés avec Floating UI."
    tickets:
      - title: "Tooltip"
        description: "Composant Tooltip et attribut data-rui-tooltip pris en charge par un moteur de tooltips global."
        status: finished
      - title: "DropdownMenu"
        description: "Menu déroulant en composant composé, avec gestion clavier et pile d'overlays."
        status: finished

  - name: "Notifications et erreurs réseau"
    description: "Toasts groupés alimentés soit impérativement, soit par l'interception de window.fetch."
    tickets:
      - title: "API popup impérative"
        description: "usePopup() avec pushError et dismiss, découplé du fetch ; messages poussés persistants, dédupliqués avec ceux du fetch (react-ui 0.3.0)."
        status: finished
      - title: "Interception fetch REST et GraphQL"
        description: "Mode opt-in interceptFetch (\"rest\" ou \"graphql\") ; en GraphQL, lecture de errors[] y compris en HTTP 200, avec hook de traduction des messages."
        status: finished
      - title: "Toasts groupés"
        description: "Généralisation de la popup en groupes de toasts configurables, plus un helper fetchJson."
        status: finished

  - name: "Outillage du monorepo et publication npm"
    description: "Workspaces npm, lint commun et publication automatisée des packages."
    tickets:
      - title: "Monorepo et lint"
        description: "Workspaces npm, build TypeScript par package, ESLint commun (react-hooks, react-refresh), Makefile."
        status: finished
      - title: "Script de publication"
        description: "publish-all ordonne les packages selon leurs dépendances internes, détecte les cycles, compare avec la version du registre, build et publie uniquement ce qui manque ; mode --dry-run."
        status: finished
      - title: "Configuration du jeton npm"
        description: "Script set-npm-token pour renseigner le jeton de publication."
        status: finished

# Contexte utile à l'auteur, qui n'a pas de champ dédié : stack détaillée, période (dates du
# premier / dernier commit), état (actif, en pause, abandonné, livré), nombre de contributeurs.
notes: |
  Stack : TypeScript 5.8, React >= 18 (peer dependency), modules ESM, build tsc, npm workspaces, ESLint 9 + typescript-eslint. Dépendances runtime de react-ui : @floating-ui/dom, react-colorful, @-reddacted-/react-hooks.
  Packages publiés sur npm en accès public : @-reddacted-/action-result 0.1.0, @-reddacted-/react-hooks 0.3.0, @-reddacted-/react-ui 0.4.0.
  Période : le dossier n'est pas un dépôt git, donc pas d'historique. Dates des fichiers : du 5 septembre 2026 (action-result, script de jeton) au 29 septembre 2026 (tickets de la roadmap react-ui).
  État : actif. Les tickets 00 à 24 de la roadmap react-ui sont implémentés et vérifiés ; le ticket 25 (Combobox + DatePicker) est en attente.
  Méthode : chaque évolution est planifiée dans .claude/plans/ (plans par ticket avec étapes cochées). Plusieurs changements cassants assumés : NavBar en 0.3.1, interception fetch opt-in en 0.3.0.
  Consommateur connu : le projet Homepedia, dont le PopupProvider a été porté dans react-ui.
  Contributeurs : un seul auteur selon toute apparence (non vérifiable sans git).
  Liens : npm uniquement, pas de dépôt distant.
  Démo : aucune capture ni démo pour l'instant ; une idée de démo est prévue plus tard, faute de temps.

# Ce que tu n'as pas pu établir ou qui demande un arbitrage de l'auteur.
questions: []
```

---

> **Pour l'import dans Workbench** (instance qui reçoit la fiche) — via le MCP `workbench` :
>
> 1. `list_projects` : vérifier qu'un projet du même nom n'existe pas déjà (sinon `update_project`).
> 2. `create_project` avec `name`, `description`, `category`, `links` (sans `replacesPage`), `documents`.
> 3. `create_feature` (`ownerType: project`) puis `create_ticket` pour chacune ; `change_ticket_status`
>    quand le statut n'est pas `pending`.
> 4. Ne pas publier ni définir de lien remplaçant la page : `suggestPublish`, `replacesPage`, `localFiles`,
>    `notes` et `questions` sont remontés à l'auteur, qui décide.
