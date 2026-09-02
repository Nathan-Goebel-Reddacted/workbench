# Atelier Portfolio

Portfolio et atelier de travail personnels : un site public qui présente projets et CV, et un
espace privé qui sert à les composer — catalogue de projets, atelier d'idées, éditeur de pages en
grille, et un serveur MCP par lequel un agent vient lire et écrire dans l'atelier.

## Sommaire

- [Prérequis](#prérequis)
- [Démarrage](#démarrage)
- [Le premier administrateur](#le-premier-administrateur)
- [Structure du dépôt](#structure-du-dépôt)
- [Commandes](#commandes)
- [Migrations](#migrations)
- [Export, import et restauration](#export-import-et-restauration)
- [Déploiement](#déploiement)
- [Qualité](#qualité)

## Prérequis

| Outil | Version | Pourquoi |
| --- | --- | --- |
| Node.js | 22+ | `process.loadEnvFile` et les workspaces npm |
| npm | 10+ | workspaces |
| Docker + Compose | récent | PostgreSQL en développement, toute la pile en production |
| `tar` | dans le `PATH` | l'export embarque le dossier `uploads/` |

Un compte OAuth GitHub **ou** Google est nécessaire : c'est la seule porte d'entrée de l'espace
privé, et le serveur refuse de démarrer si aucun fournisseur n'est configuré.

## Démarrage

```bash
git clone <url> && cd Workbench
npm ci

cp .env.example .env      # puis éditer, voir ci-dessous
make db-up                # PostgreSQL, attend son healthcheck
make db-migrate           # applique les 15 migrations
npm run dev               # backend :3000, site public :5173, espace privé :5174
```

`make start` enchaîne `db-up` et `dev`.

### Ce qu'il faut renseigner dans `.env`

Le fichier `.env.example` documente chaque variable ; quatre sont **requises** et le serveur les
vérifie toutes d'un coup au démarrage, en nommant celles qui manquent :

| Variable | Rôle |
| --- | --- |
| `JWT_SECRET` | signature du cookie de session — `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `APP_URL` | origine du backend, sert à construire les URLs de callback OAuth |
| `FRONTEND_PUBLIC_URL` | origine du site public — **origine CORS autorisée** |
| `FRONTEND_PRIVATE_URL` | origine de l'espace privé — origine CORS, et cible de redirection après connexion |

S'y ajoute au moins une paire d'identifiants OAuth. Un fournisseur n'est branché que si **ses deux
variables** sont renseignées : sinon ni son bouton ni ses routes n'existent, et un avertissement le
dit au démarrage.

- **GitHub** — <https://github.com/settings/developers> › New OAuth App, callback
  `${APP_URL}/auth/github/callback`
- **Google** — <https://console.cloud.google.com/apis/credentials>, callback
  `${APP_URL}/auth/google/callback`

En développement local, `ALLOW_INSECURE_COOKIE=true` est nécessaire : le backend est en `http://`
et le cookie de session est `secure` par défaut. **À ne jamais activer derrière un domaine public**
— la session voyagerait en clair.

## Le premier administrateur

Sur une base vierge la liste blanche est vide : aucune connexion OAuth n'aboutit, et la route qui
ajoute une adresse exige déjà le rôle `edit`. `BOOTSTRAP_ADMIN_EMAIL` est la seule porte d'entrée.

```bash
# .env
BOOTSTRAP_ADMIN_EMAIL=moi@exemple.tld
```

Elle est relue à chaque démarrage, n'enlève jamais rien, et fait deux choses de façon idempotente :
l'adresse entre dans la liste blanche si elle en est absente, et le rôle `edit` lui est accordé — à
la création du compte, ou au démarrage suivant si le compte existait déjà. Elle peut être vidée une
fois le premier administrateur en place.

L'adresse doit être celle **vérifiée et principale** du compte OAuth.

## Structure du dépôt

```
packages/
├── backend/           Fastify + MikroORM + serveur MCP  (port 3000)
├── frontend-public/   React — site public               (port 5173)
├── frontend-private/  React — espace privé              (port 5174)
├── shared-ui/         thème, authentification, composants partagés
└── content-renderer/  rendu des grilles, partagé par l'éditeur et le site public

docker/web/            image nginx qui sert les deux fronts en production
ioPort/                dépôt des dumps pour l'import/export manuel
backup/                sauvegardes automatiques prises avant chaque import
```

Le backend suit un découpage DDD : `contexts/<nom>/{domain,application,infrastructure}`, plus un
`shared/`. Les alias `@contexts/*` et `@shared/*` pointent dans `packages/backend/src`.

## Commandes

`make help` liste tout. Les plus utiles :

| Commande | Effet |
| --- | --- |
| `npm run dev` | les trois briques en parallèle |
| `npm run build` | compile le backend et les deux fronts |
| `npm test` | Vitest — domaine et fonctions pures |
| `npm run lint` / `npm run format` | ESLint / Prettier sur tout le dépôt |
| `npm run typecheck` | `tsc --noEmit` sur les cinq paquets |
| `make db-up` / `make db-down` | PostgreSQL |
| `make db-shell` | shell `psql` sur la base |

## Migrations

```bash
make db-migrate                      # applique les migrations en attente
make db-migrate-status               # liste leur état
make db-migrate-create name=MonNom   # crée une migration
make db-migrate-down                 # annule la dernière
```

La configuration MikroORM (`packages/backend/src/shared/infrastructure/mikro-orm.config.ts`) ancre
ses chemins sur le fichier lui-même, pas sur le répertoire courant : les mêmes commandes marchent
depuis la racine du dépôt et depuis l'image de production, où le processus démarre dans `/app`.

En production, `@mikro-orm/cli` est absent (`npm ci --omit=dev`) — d'où une entrée dédiée :

```bash
make db-migrate-prod
```

## Export, import et restauration

Deux chemins pour le même service : les routes `POST /io/export` et `POST /io/import` (rôle `edit`)
depuis l'espace privé, ou le CLI. La liste des tables est dérivée des métadonnées MikroORM : une
nouvelle entité entre dans l'export sans qu'on touche à quoi que ce soit.

```bash
make db-export              # → ioPort/<base>-<date>.sql (+ archive des uploads)
make db-import              # importe le dump le plus récent de ioPort/
make db-import file=x.sql   # importe un dump précis
```

Trois choses à savoir avant d'importer :

1. **C'est un upsert, pas un remplacement.** Les lignes de même clé primaire sont écrasées par
   celles du dump ; celles qui n'y figurent pas restent en place. Rien n'est supprimé.
2. **Une sauvegarde est prise automatiquement** avant tout import réel, dans `backup/`, et son nom
   est renvoyé dans la réponse. C'est le point de retour.
3. **Un import peut être simulé** — `POST /io/import?dryRun=1` joue tout l'import, rend le même
   rapport table par table, puis annule la transaction. La base et le dossier `uploads/` ressortent
   inchangés.

Un dump qui contient une table sans entité correspondante est refusé plutôt qu'appliqué : la
laisser passer écrirait directement dans la table réelle, sans le `ON CONFLICT`.

### Restaurer

Déposer le `.sql` (et son `.tar.gz` d'uploads s'il y en a un) dans `ioPort/`, puis `make db-import
file=<nom>.sql`. Les médias ne suivent que par ce chemin : un dump envoyé dans le corps d'une
requête n'a pas de nom, donc pas d'archive à apparier.

## Déploiement

Toute la pile passe derrière un nginx, sous **une seule origine** :

| Chemin | Sert |
| --- | --- |
| `/` | site public |
| `/admin/` | espace privé |
| `/api/` | backend (le préfixe est retiré par le proxy) |

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
make db-migrate-prod
```

Avant de lancer, remplacer les URLs de développement du `.env` par l'origine réelle :

```dotenv
APP_URL=https://domaine.tld/api
FRONTEND_PUBLIC_URL=https://domaine.tld
FRONTEND_PRIVATE_URL=https://domaine.tld/admin
VITE_API_URL=https://domaine.tld/api
VITE_PUBLIC_URL=https://domaine.tld
ALLOW_INSECURE_COOKIE=
WEB_PORT=8080
```

Les URLs de callback OAuth doivent alors pointer sur `${APP_URL}/auth/<fournisseur>/callback`.

Deux points à ne pas manquer :

- `VITE_API_URL` et `VITE_PUBLIC_URL` sont **figées dans le bundle au moment du build** : les
  changer impose de reconstruire l'image `web`.
- Le port du backend n'est pas publié sur l'hôte ; seul nginx l'atteint, par le réseau compose. Son
  healthcheck interroge `/health`, qui vérifie aussi la base.

Les uploads vivent dans le volume `uploads_data` — c'est ce qui les fait survivre à un rebuild.

## Qualité

Un hook de pré-commit (lefthook, installé par `npm ci`) passe ESLint et Prettier sur les fichiers
indexés. La CI GitHub Actions rejoue la même chose sur tout le dépôt, plus les types, les tests et
le build.

```bash
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

Les tests ne couvrent pour l'instant que du domaine et des fonctions pures — pas de base, pas de
serveur HTTP simulé : la géométrie des grilles, le garde de rôles, les références de tickets, et la
génération du script d'import.
