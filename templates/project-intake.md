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
  name: ""

  # personal | professional | academic
  # professional = fait dans le cadre d'un emploi ou pour un client ; academic = école / formation.
  category: personal

  # Texte brut (pas de Markdown), en français : le site public est francophone.
  # 3 à 8 phrases : le problème, ce que fait le projet, comment (stack, choix marquants), où il en est.
  description: |


  # Proposition seulement : un projet naît privé, l'auteur décide de la publication.
  suggestPublish: false

  # Liens externes. url = URL absolue valide (https://…).
  # logo optionnel : chemin ou URL finissant par .png .jpg .jpeg .svg .webp, sinon laisser vide.
  # replacesPage: true si ce lien doit remplacer la page projet (ex. site en ligne) — au plus UN lien.
  links:
    - url: ""
      displayText: ""
      logo: ""
      replacesPage: false

  # Fichiers déjà hébergés en ligne (pdf, image, vidéo) : Workbench enregistre une URL, il n'uploade rien.
  # Un fichier seulement présent dans le dépôt va dans `localFiles`, pas ici.
  documents:
    - name: ""
      url: ""

  # Fichiers du dépôt qui mériteraient d'être joints (captures, diagrammes, rapport…), chemin relatif.
  localFiles: []

# Découpage du travail. Une feature = un bloc fonctionnel cohérent (ex. "Authentification",
# "Export PDF"), pas un fichier ni une couche technique. Vise 3 à 10 features.
# Les tickets décrivent le travail réel : déduits du code, des commits, des TODO, des issues.
# status : finished (fait et en place) | in_progress (commencé, incomplet) | pending (prévu, pas commencé)
features:
  - name: ""
    description: ""
    tickets:
      - title: ""
        description: ""
        status: finished

# Contexte utile à l'auteur, qui n'a pas de champ dédié : stack détaillée, période (dates du
# premier / dernier commit), état (actif, en pause, abandonné, livré), nombre de contributeurs.
notes: |


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
