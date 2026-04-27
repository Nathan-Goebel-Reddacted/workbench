# Context : User

## Responsabilité

Gestion de l'identité et des données personnelles des utilisateurs autorisés.
L'accès est restreint à une whitelist — il n'y a pas d'inscription.

## Agrégats

- **User** — identité d'un utilisateur autorisé, composée d'un identifiant, d'un nom, d'un prénom et d'un email

## Value Objects

| Value Object | Règles métier |
|---|---|
| `UserId` | UUID généré à la création — hérite de `shared/Id` |
| `Name` | Non vide, normalisé en UPPERCASE |
| `Surname` | Non vide, première lettre en majuscule |
| `Email` | Format valide (`x@x.x`), normalisé en lowercase |

## Règles métier

- L'email est normalisé en lowercase à la création
- L'unicité et l'autorisation de l'email sont vérifiées en couche applicative (whitelist)
- Aucune gestion de mot de passe — authentification déléguée à OAuth

## Exceptions domaine

| Exception | Déclencheur |
|---|---|
| `NotNullOrEmptyException` | Name ou Surname vide |
| `InvalidEmailException` | Format email invalide |

## Notes

Voir ADR-008 pour le détail du flux d'authentification OAuth et de la gestion de la whitelist.
