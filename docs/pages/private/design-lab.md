# Page : Design Lab (privé)

## Objectif

Page secrète de test visuel — permet d'explorer et valider des thèmes de couleur sans toucher au code de production.
Elle regroupe tous les composants UI du site dans leur état réel, avec un panneau de contrôle des variables CSS.

## Accès

- Route non listée, non linkée (ex: `/design-lab` ou `/__lab`)
- Aucune authentification requise — l'obscurité suffit

---

## Section 1 : Panneau de thème

Panneau fixe (sidebar ou header collapsible) contenant :

### Color pickers

Un champ couleur par variable CSS globale :

| Variable | Rôle |
|---|---|
| `--color-primary` | Couleur d'accentuation principale |
| `--color-secondary` | Couleur secondaire / complémentaire |
| `--color-background` | Fond général |
| `--color-surface` | Fond des cartes / panneaux |
| `--color-text` | Texte principal |
| `--color-text-muted` | Texte secondaire / légende |
| `--color-border` | Bordures et séparateurs |

> Liste à affiner lors de l'implémentation selon les variables réellement définies dans le design system.

### Contrôles

- **Randomiser** — génère un thème aléatoire (valeurs cohérentes, pas juste du bruit)
- **Reset** — revient au thème par défaut
- **Copier les variables** — copie dans le presse-papier le bloc CSS prêt à coller

### Comportement

- Les changements s'appliquent en temps réel via `style` sur `:root`
- Aucune persistance — le thème est perdu au rechargement (intentionnel)

---

## Section 2 : Showcase des composants

Chaque composant est affiché dans son état réel (pas de mock), avec les données les plus représentatives possible.

### Navigation

- Header public (nom/logo + liens Nav)

### Typographie

- H1 à H4
- Paragraphe courant
- Texte muted / légende
- Lien inline

### Boutons & actions

- Bouton primaire
- Bouton secondaire
- Bouton désactivé

### Cards & listes

- Card projet (logo + nom, cliquable)
- Grille de cards (disposition home)
- Tags de stack

### Composants de page Project

- En-tête projet (nom, logo, statut, stack)
- MediaBanner (carousel avec placeholder)
- Carte de lien rapide

### Composants CV

- Sélecteur de CV
- Bouton de téléchargement

### Formulaires & inputs

- Champ texte
- Textarea
- Select

### Feedback

- Message d'erreur
- Message de succès
- Badge / statut

---

## Notes

- Cette page n'est jamais référencée dans la navigation ni dans le sitemap
- Elle ne doit pas être indexée (`noindex`)
- Les composants affichés ici doivent rester synchronisés manuellement avec les vrais composants au fil du développement
