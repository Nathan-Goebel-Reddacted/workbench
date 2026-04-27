# ADR-007 : Stack technique

**Date** : 2026-04-20
**Statut** : `accepté`
**Projet** : Atelier Portfolio

## Contexte

Choix de la stack d'implémentation pour l'ensemble du projet.
Contraintes : séparation claire frontend/backend, TypeScript bout-en-bout,
compatible MCP server, Ollama local pour l'IA.

## Décision

### Frontend
- **React 18 + TypeScript** via Vite
- **react-grid-layout** pour le GridBuilder et le rendu des ProjectPages (cf. ADR-005)
- **React Router** pour la navigation SPA

### Backend
- **Node.js + Fastify** — API REST + MCP server dans le même process
- **MikroORM** — ORM TypeScript-first, Unit of Work, repositories, migrations
- **PostgreSQL** — base de données relationnelle

### IA / voix
- **Ollama** — LLM et STT en local (modèle à choisir selon benchmarks)
- **AWS Strands** — orchestration des agents (cf. ADR-003)

### Auth
- OAuth 2.0 (cf. ADR-008)

## Conséquences

- Deux processus à lancer en dev : frontend Vite (ex: `:5173`) et backend Fastify (ex: `:3000`)
- Les entités MikroORM servent de source de vérité pour le schéma de base
- Le MCP server est exposé comme un endpoint Fastify supplémentaire (ou process séparé si nécessaire)
- Ollama doit être installé et actif sur la machine locale
