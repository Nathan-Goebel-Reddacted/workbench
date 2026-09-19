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

### Couches d'un contexte (frontend-private)

- `types.ts` / `status.ts` / `api.ts` : modèle et accès HTTP — n'importent jamais `components/`, `pages/` ni `hooks/` (vérifié par `boundaries.test.ts`)
- `hooks/` : cas d'usage — un hook par intention (`useAccessRequests`, `usePairingRequests`)
- `components/` / `pages/` : affichage — **pour tout nouveau code**, passer par un hook du contexte plutôt qu'appeler `api.ts` directement (l'existant n'est pas encore migré)
- Composition entre contextes : un contexte peut afficher le composant public d'un autre via son `index.ts` (sans cycle, vérifié par `boundaries.test.ts`) ; quand il a besoin de ses **données**, il déclare un port que `app/` branche (ex. `BindingSource` de content-editor, implémenté par `app/bindingSource.ts`) ; les lectures qu'un contexte expose pour ces ports vivent dans son `queries.ts`, importable par `app/` seulement
- Concept partagé par plusieurs contextes (ex. `Category`) : `shared/domain/`, libellés dans `shared/components/`
- Aucune règle métier côté front : placement, valeurs initiales, attribution, invariants → backend. Le front peut refléter une règle pour le confort (bouton désactivé), jamais la porter seul
- Libellés de l'interface en **anglais**

### Styles

- Styles en **inline CSS** (`CSSProperties`) — pas de framework CSS externe
- Pas de fichier `.css` propre sauf pour les resets globaux (`global.css`)
- Les composants lisent exclusivement les CSS vars pour les couleurs
