# Context : AIAssistant

## Responsabilité

Interfaces IA pour accélérer la saisie et déléguer des tâches de remplissage
ou de consultation à des agents externes.

## Composants

- **LLM** — modèle de langage (à définir) accessible depuis l'espace privé
- **SpeechToText** — transcription vocale pour pré-remplir idées, tickets, devlog
- **AgentTool** — déclaration d'un agent IA externe avec ses permissions (lecture / écriture)
- **ProjectContext** — fiche structurée injectable dans un agent (données d'un Project ou d'une Idea)

## Règles métier

- Un AgentTool déclare explicitement ce qu'il peut lire et écrire (pas d'accès global implicite)
- Le SpeechToText produit un brouillon — l'utilisateur valide avant enregistrement
- Un ProjectContext est généré à la demande, pas stocké en continu

## Pages associées

- `pages/private/ai-assistant.md`

## Dépendances

- Lit et écrit dans **ProjectCatalog** (features, tickets, description)
- Lit et écrit dans **IdeaWorkshop** (idées, devlog)
