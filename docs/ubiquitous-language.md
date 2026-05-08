# Ubiquitous Language

Termes du domaine partagés entre tous les bounded contexts.

---

## Portfolio (espace public)

| Terme | Définition |
|---|---|
| **Profile** | L'identité publique : bio, liens, compétences mises en avant |
| **PublicProject** | Un Project avec `public = true` — apparaît automatiquement sur la home |
| **CV** | Document PDF uploadé, sélectionnable et téléchargeable |
| **ProjectPage** | Page publique d'un projet, rendue à partir du PageLayout défini dans ContentEditor |
| **MediaBanner** | Bandeau de médias (screenshots, vidéos) en haut de la ProjectPage |

---

## ProjectCatalog

| Terme | Définition |
|---|---|
| **Project** | Un projet réel, avec statut, stack, description, features, tickets |
| **ProjectStatus** | État d'un projet : `en cours` / `shipped` / `archivé` |
| **Feature** | Fonctionnalité attendue d'un projet |
| **Ticket** | Tâche concrète rattachée à une feature ou un projet |
| **Tag** | Technologie ou compétence associée à un projet (ex: React, PHP) |
| **ADR** | Architecture Decision Record — décision technique documentée |
| **Document** | Fichier attaché à un Project, Feature ou Ticket — PDF, image ou vidéo |
| **DocumentType** | Type d'un Document : `pdf` / `image` / `video` |

---

## IdeaWorkshop

| Terme | Définition |
|---|---|
| **Idea** | Concept de projet non démarré, en cours de théorisation |
| **Mindmap** | Carte mentale liée à une Idea ou un Project |
| **DevLog** | Journal de bord chronologique d'un Project ou d'une Idea |

---

## AIAssistant

| Terme | Définition |
|---|---|
| **Prompt** | Requête envoyée au LLM |
| **SpeechInput** | Entrée vocale transcrite via speech-to-text |
| **AgentTool** | Déclaration d'un agent IA externe autorisé à lire/écrire |
| **ProjectContext** | Fiche structurée d'un projet injectable dans un agent |

---

## User

| Terme | Définition |
|---|---|
| **User** | Agrégat représentant l'identité d'un utilisateur dans le système |
| **UserId** | Identifiant unique d'un utilisateur (UUID) |
| **Name** | Nom de famille de l'utilisateur — normalisé en majuscules |
| **Surname** | Prénom de l'utilisateur — normalisé avec première lettre en majuscule |
| **Email** | Adresse email valide et normalisée en lowercase — unique dans le système |

---

## ContentEditor

| Terme | Définition |
|---|---|
| **PageLayout** | Mise en page d'une page publique (portfolio ou projet), composée de sections |
| **Section** | Élément de contenu dans un PageLayout — typé et positionné dans la grille |
| **SectionType** | Type d'une Section : `text`, `image`, `video`, `code`, `link`, `embed` |
| **ContentRef** | Référence à un champ d'un autre contexte (ex: `project.title`, `portfolio.bio`) |
| **GridPosition** | Position d'une Section dans la grille : colonne et ordre |
| **PageType** | Type de page éditée : `portfolio` ou `project` |
| **PageRef** | UUID de la ressource ciblée (portfolio ou projet) |
