# Ubiquitous Language

Termes du domaine partagés entre tous les bounded contexts.

---

## Portfolio (espace public)

| Terme | Définition |
|---|---|
| **Profile** | L'identité publique : bio, liens, compétences mises en avant |
| **PublicProject** | Un Project avec `public = true` — apparaît automatiquement sur la home |
| **CV** | Document PDF uploadé, sélectionnable et téléchargeable |
| **ProjectPage** | Page publique d'un projet, composée de sections en grille |
| **Section** | Bloc de contenu dans une ProjectPage (texte, image, vidéo, code…) |
| **GridLayout** | Disposition en grille des sections d'une ProjectPage |
| **Block** | Unité atomique de contenu dans une Section |
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
| **Editor** | Interface privée d'édition du contenu public |
| **GridBuilder** | Outil de construction de GridLayout par drag & drop |
