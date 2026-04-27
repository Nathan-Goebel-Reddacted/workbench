# Page : AI Assistant (privé)

## Objectif

Interface IA pour accélérer la saisie et connecter des agents externes.

## Sections

### 1. Chat LLM
- Interface de conversation avec le LLM
- Contexte injectable : sélectionner un Project ou une Idea pour focaliser le LLM

### 2. Saisie vocale (Speech-to-Text)
- Enregistrement vocal → transcription
- Destination sélectionnable : nouvelle idée / ticket / devlog / description projet
- Validation avant enregistrement

### 3. Gestion des agents (AgentTools)
- Déclarer un agent externe (nom, endpoint, clé)
- Définir ses permissions : lecture / écriture sur Project, Idea, Ticket, DevLog
- Activer / désactiver un agent

## Notes

- La saisie vocale produit toujours un brouillon — jamais d'enregistrement automatique
- Les agents n'ont accès qu'aux données explicitement autorisées
