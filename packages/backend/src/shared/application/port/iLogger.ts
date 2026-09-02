/**
 * Journal structuré, vu depuis l'application. Le contexte est un objet plutôt qu'une chaîne
 * interpolée : c'est lui qui rend une ligne exploitable par un collecteur, et qui portera
 * l'identifiant de corrélation quand une requête est en cause.
 */
export interface ILogger {
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
}
