/**
 * Les rôles vivent dans le noyau partagé et non dans le contexte User, parce que l'autorisation
 * est transverse : le jeton les porte, les gardes HTTP les lisent, les contextes les exigent.
 * Le contexte User reste propriétaire des règles qui les manipulent (cf. `role.ts`).
 */
export enum UserRole {
    VIEW = 'view',
    EDIT = 'edit',
}
