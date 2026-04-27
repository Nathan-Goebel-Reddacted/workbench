# ADR-003 : Architecture de l'AIAssistant

**Date** : 2026-04-19
**Statut** : `accepté`
**Projet** : Atelier Portfolio

## Contexte

L'espace privé intègre un assistant IA avec deux usages distincts :
1. **Pré-remplissage / STT** — transcrire une entrée vocale et pré-remplir des champs (ticket, devlog, description d'idée)
2. **Accès agent externe** — permettre à Claude Code d'interagir avec l'application comme le ferait un utilisateur (lire, créer, modifier des données)

La contrainte principale est de rester gratuit et local autant que possible.

## Options considérées

### Pour le LLM / STT
- **Ollama + Strands** — LLM local via Ollama, orchestration d'agents via AWS Strands (open-source). Gratuit, données locales, pas de dépendance à une API payante.
- **API OpenAI / Claude** — performant mais payant, données envoyées à un tiers.

### Pour l'accès agent (Claude Code)
- **Actions exposées comme MCP tools** — chaque action métier (créer projet, ajouter ticket, modifier devlog…) est implémentée comme un tool MCP. Claude Code se connecte au MCP server de l'app et peut effectuer toutes les actions.
- **API REST classique** — Claude Code passe par l'API comme un client normal, sans contrat tool explicite.

## Décision

**Ollama + Strands pour le LLM/STT. Actions métier structurées comme des tools, exposées via MCP server.**

Les actions métier principales (CRUD sur Project, Idea, Ticket, Feature, DevLog) sont implémentées en tant que fonctions à interface de tool dès le départ. Cette structure sert deux objectifs :
- Exposées via un MCP server → Claude Code peut les appeler directement
- Réutilisables comme tools pour Strands dans les flows de pré-remplissage

Un seul modèle d'implémentation pour les deux usages.

## Conséquences

- Les actions métier doivent être conçues avec une interface de type tool (nom, description, paramètres typés, retour structuré) dès la conception
- Le backend expose un MCP server en plus de l'API classique (ou à la place si la stack le permet)
- Ollama doit être installé et fonctionnel sur la machine de l'utilisateur
- Les performances STT dépendent du modèle Ollama choisi (à définir selon les benchmarks)
- Pas de coût d'API, données 100% locales
