# ADR-008 : Authentification

**Date** : 2026-04-20
**Statut** : `accepté`
**Projet** : Atelier Portfolio

## Contexte

L'espace privé (Editor, ProjectCatalog, IdeaWorkshop, AIAssistant) est réservé à un nombre limité d'utilisateurs de confiance.
L'espace public est accessible sans authentification.
Il n'y a pas d'inscription — l'accès est accordé manuellement via une whitelist.

## Décision

**OAuth 2.0 via un provider existant (GitHub ou Google).**

Les emails autorisés sont déclarés dans une whitelist côté serveur (variable d'environnement).
Toute tentative de connexion avec un email absent de la whitelist est rejetée.

Flux :
1. L'utilisateur clique "Se connecter" → redirigé vers le provider OAuth
2. Après autorisation, le backend reçoit le profil (email du provider)
3. Si l'email est dans la whitelist → session créée (JWT httpOnly cookie)
4. Sinon → rejet 401

Les routes privées Fastify vérifient le JWT à chaque requête.
Le frontend React vérifie la session au chargement — si absente, redirige vers la page de login.

## Conséquences

- Aucune gestion de mot de passe
- Pas d'inscription — accès géré via `ALLOWED_EMAILS` en variable d'environnement
- Si le provider OAuth est inaccessible, l'espace privé est inaccessible (acceptable)
- Le provider OAuth à retenir (GitHub vs Google) est un choix de préférence, sans impact architectural
