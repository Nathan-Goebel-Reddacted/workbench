# ADR-008 : Authentification

**Date** : 2026-04-20
**Statut** : `accepté`
**Projet** : Atelier Portfolio

## Contexte

L'espace privé (Editor, ProjectCatalog, IdeaWorkshop, AIAssistant) est réservé à un nombre limité d'utilisateurs de confiance.
L'espace public est accessible sans authentification.
Il n'y a pas d'inscription — l'accès est accordé manuellement via une whitelist.

## Décision

**OAuth 2.0 via GitHub et Google (multi-provider).**

Le même email connecté via GitHub ou Google aboutit au même profil User.
Les emails autorisés sont stockés en base de données dans la table `allowed_emails`, gérée via l'API `GET/POST/DELETE /auth/allowed-emails`.
Toute tentative de connexion avec un email absent de la whitelist est rejetée.

Flux :
1. L'utilisateur clique "Se connecter" → redirigé vers le provider OAuth
2. Après autorisation, le backend reçoit le profil (email du provider)
3. Si l'email est dans `allowed_emails` → session créée (JWT httpOnly cookie `session`)
4. Sinon → rejet 401
5. Si l'utilisateur n'a pas encore de profil → auto-provisioning à la première connexion

Les routes privées Fastify vérifient le JWT à chaque requête via un hook `onRequest` global.
Le frontend React vérifie la session au chargement — si absente, redirige vers la page de login.

## Conséquences

- Aucune gestion de mot de passe
- Pas d'inscription — accès géré via la table `allowed_emails` (API CRUD)
- La whitelist est modifiable à chaud sans redémarrer le serveur
- Si le provider OAuth est inaccessible, l'espace privé est inaccessible (acceptable)
- Les deux providers (GitHub et Google) sont supportés simultanément
