# CLAUDE.md — Atelier Portfolio

## Documentation

| Fichier | Contenu |
|---|---|
| `docs/vision.md` | Objectif global et philosophie du projet |
| `docs/ubiquitous-language.md` | Glossaire DDD — lire avant tout travail métier |
| `docs/adr/007-stack-technique.md` | Stack complète (React, Fastify, MikroORM, Ollama) |
| `docs/adr/008-authentification.md` | Stratégie OAuth 2.0 |
| `docs/contexts/` | Un fichier par bounded context (Portfolio, ProjectCatalog, IdeaWorkshop, AIAssistant, ContentEditor) |
| `docs/pages/private/` | Specs des pages privées (Design Lab, Editor, etc.) |
| `docs/pages/public/` | Specs des pages publiques (Home, CV, Project) |

## Structure du monorepo

```
packages/
├── backend/          # Fastify + MikroORM + MCP server (port 3000)
├── frontend-public/  # React — pages publiques (port 5173)
├── frontend-private/ # React — interface admin (port 5174)
└── shared-ui/        # Composants et providers partagés entre les deux frontends
```

## Conventions frontend

### Couleurs — règle absolue

**Interdit** : toute valeur de couleur codée en dur (hex, rgb, hsl, nom CSS).

```tsx
// ❌ interdit
color: '#1a1a1a'
backgroundColor: 'white'
borderColor: 'rgba(0,0,0,0.1)'

// ✅ obligatoire
color: 'var(--color-text)'
backgroundColor: 'var(--color-bg)'
borderColor: 'var(--color-border)'
```

### Variables CSS disponibles

| Variable | Rôle |
|---|---|
| `--color-bg` | Fond général de la page |
| `--color-surface` | Fond des cartes / panneaux |
| `--color-border` | Bordures et séparateurs |
| `--color-text` | Texte principal |
| `--color-text-muted` | Texte secondaire / légende |
| `--color-primary` | Couleur d'accentuation principale |
| `--color-primary-hover` | État hover de la couleur primaire |

Ces variables sont injectées sur `:root` par `ThemeProvider` (shared-ui) et peuvent être modifiées via le Design Lab.

### Composants shared-ui disponibles

| Export | Usage |
|---|---|
| `ThemeProvider` | Wrapper racine — injecte les CSS vars |
| `AuthProvider` + `useAuth` | Authentification |
| `ProtectedRoute` | Route gardée par auth |
| `NavBar` | Barre de navigation |
| `Button` | Bouton générique (variants : `primary`, `secondary`, `ghost`) |
| `ColorPicker` | Picker couleur simple (hex + swatch) |

### Styles

- Styles en **inline CSS** (`CSSProperties`) — pas de framework CSS externe
- Pas de fichier `.css` propre sauf pour les resets globaux (`global.css`)
- Les composants lisent exclusivement les CSS vars pour les couleurs
