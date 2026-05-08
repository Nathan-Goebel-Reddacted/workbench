.PHONY: help \
        db-up db-down db-restart db-logs db-shell \
        db-migrate db-migrate-down db-migrate-fresh db-migrate-create db-migrate-status db-migrate-debug \
        dev dev-backend dev-public dev-private build

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
	@echo ""
	@echo "  Développement"
	@echo "    make dev                    Lancer le backend en mode dev"
	@echo "    make build                  Compiler le backend (tsc)"
	@echo ""

# ──────────────────────────────────────────────
# Docker / PostgreSQL
# ──────────────────────────────────────────────
db-up:
	docker compose up -d postgres

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
MIKRO = cd packages/backend && node --import tsx node_modules/.bin/mikro-orm

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

# ──────────────────────────────────────────────
# Développement
# ──────────────────────────────────────────────
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
