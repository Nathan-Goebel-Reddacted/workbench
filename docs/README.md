# Documentation — Atelier Portfolio

## Structure

```
docs/
├── vision.md                        # Objectif global et philosophie
├── ubiquitous-language.md           # Glossaire DDD
├── contexts/
│   ├── portfolio.md                 # Pages publiques, CV, GridLayout
│   ├── project-catalog.md           # Projets, features, tickets, ADR
│   ├── idea-workshop.md             # Idées, mindmaps, devlog
│   ├── ai-assistant.md              # LLM, STT, agents
│   └── content-editor.md            # Éditeur privé, GridBuilder
├── pages/
│   ├── public/
│   │   ├── home.md                  # Page d'accueil
│   │   ├── cv.md                    # Page CV
│   │   └── project.md               # Page projet (GridLayout)
│   └── private/
│       ├── editor.md                # Éditeur home + CVs
│       ├── project-catalog.md       # Gestion projets + GridBuilder
│       ├── idea-workshop.md         # Boîte à idées + mindmaps + devlog
│       └── ai-assistant.md          # Chat LLM + STT + agents
└── adr/
    ├── 001-template.md              # Template ADR vide
    ├── 002-mindmeister-integration.md
    ├── 003-ai-assistant-architecture.md
    ├── 004-portfolio-projectcatalog-visibility.md
    └── 006-featured-projects-limit.md
```

## Bounded Contexts

| Context | Responsabilité |
|---|---|
| **Portfolio** | Rendu public des pages |
| **ProjectCatalog** | Cycle de vie des projets réels |
| **IdeaWorkshop** | Théorisation et réflexion |
| **AIAssistant** | LLM, voix, agents externes |
| **ContentEditor** | Édition du contenu public |
