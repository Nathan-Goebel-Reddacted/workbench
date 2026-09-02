.PHONY: help \
        db-up db-down db-restart db-logs db-shell \
        db-migrate db-migrate-down db-migrate-fresh db-migrate-create db-migrate-status db-migrate-debug \
        db-export db-import db-migrate-prod \
        install start dev dev-backend dev-public dev-private build

# Charger le .env automatiquement si présent
ifneq (,$(wildcard .env))
  include .env
  export
endif

# ──────────────────────────────────────────────
# Aide
# ──────────────────────────────────────────────
help:
	@echo ""
	@echo "  Base de données"
	@echo "    make db-up                  Démarrer PostgreSQL (Docker)"
	@echo "    make db-down                Arrêter PostgreSQL"
	@echo "    make db-restart             Redémarrer PostgreSQL"
	@echo "    make db-logs                Afficher les logs PostgreSQL"
	@echo "    make db-shell               Ouvrir un shell psql"
	@echo ""
	@echo "    make db-migrate             Appliquer les migrations en attente"
	@echo "    make db-migrate-down        Annuler la dernière migration"
	@echo "    make db-migrate-fresh       Supprimer et recréer toutes les tables"
	@echo "    make db-migrate-create      Créer une migration (name=MonNom)"
	@echo "    make db-migrate-status      Lister les migrations et leur état"
	@echo "    make db-migrate-debug       Afficher les entités détectées par MikroORM"
	@echo "    make db-migrate-prod        Appliquer les migrations dans l'image de production"
	@echo ""
	@echo "  Import / Export (dossier ioPort/)"
	@echo "    make db-export              Exporter la base vers ioPort/<db>-<date>.sql"
	@echo "    make db-import              Importer le dump le plus récent de ioPort/"
	@echo "    make db-import file=x.sql   Importer un dump précis de ioPort/"
	@echo ""
	@echo "  Développement"
	@echo "    make install                Installer toutes les dépendances npm"
	@echo "    make start                  Démarrer PostgreSQL + tout le projet"
	@echo "    make dev                    Lancer le dev sans démarrer la DB"
	@echo "    make build                  Compiler le backend (tsc)"
	@echo ""

# ──────────────────────────────────────────────
# Docker / PostgreSQL
# ──────────────────────────────────────────────
# --wait : bloque jusqu'à ce que le healthcheck de postgres passe. Sans ça, `make start`
# rend la main immédiatement et lance backend + frontends alors que la base n'accepte pas
# encore de connexion — le front sert alors une page vide (layout non chargé, sans retry).
db-up:
	docker compose up -d --wait postgres

db-down:
	docker compose stop postgres

db-restart:
	docker compose restart postgres

db-logs:
	docker compose logs -f postgres

db-shell:
	docker compose exec postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

# ──────────────────────────────────────────────
# Migrations MikroORM
# ──────────────────────────────────────────────
MIKRO = cd packages/backend && node --import tsx node_modules/@mikro-orm/cli/cli

db-migrate:
	$(MIKRO) migration:up

db-migrate-down:
	$(MIKRO) migration:down

db-migrate-fresh:
	$(MIKRO) migration:fresh

db-migrate-create:
	$(MIKRO) migration:create $(if $(name),--name $(name),)

db-migrate-status:
	$(MIKRO) migration:list

db-migrate-debug:
	$(MIKRO) debug

# Image de production : @mikro-orm/cli est une devDependency, absente après
# `npm ci --omit=dev`. dist/migrate.js n'utilise que le noyau ORM.
db-migrate-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend node packages/backend/dist/migrate.js

# ──────────────────────────────────────────────
# Import / Export de la base (dossier ioPort/)
# ──────────────────────────────────────────────
# Passe par le même service que les routes POST /io/export et POST /io/import : la liste des
# tables est dérivée des métadonnées MikroORM, donc tous les bounded contexts sont couverts.
IO = cd packages/backend && node --import tsx src/shared/infrastructure/io/cli.ts

db-export:
	$(IO) export

# L'import est un upsert par clé primaire : rien n'est supprimé, les lignes de même id sont
# écrasées par celles du dump.
db-import:
	$(IO) import $(file)

# ──────────────────────────────────────────────
# Développement
# ──────────────────────────────────────────────
install:
	npm install

start: db-up dev

dev:
	npm run dev

dev-backend:
	npm run dev:backend

dev-public:
	npm run dev:frontend-public

dev-private:
	npm run dev:frontend-private

build:
	npm run build --workspace=packages/backend
