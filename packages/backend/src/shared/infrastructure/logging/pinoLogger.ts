import pino, { Logger } from 'pino';
import { ILogger } from '@shared/application/port/iLogger.js';

/**
 * Le journal technique de l'application.
 *
 * Il est construit avant tout le reste — avant l'ORM, avant Fastify — parce que tout le
 * reste peut avoir besoin de journaliser, y compris l'échec de son propre démarrage. Fastify
 * reçoit ensuite cette instance plutôt que d'en fabriquer une : les lignes émises avant qu'il
 * n'existe et celles émises pendant une requête sortent ainsi au même format.
 */
export function createLoggerInstance(level: string): Logger {
    // Le JSON sur stdout est le bon format en conteneur : c'est le collecteur qui décide
    // de la destination, pas l'application.
    return pino({ level });
}

export class PinoLogger implements ILogger {
    constructor(private readonly log: Pick<Logger, 'info' | 'warn' | 'error'>) {}

    info(message: string, context: Record<string, unknown> = {}): void {
        this.log.info(context, message);
    }

    warn(message: string, context: Record<string, unknown> = {}): void {
        this.log.warn(context, message);
    }

    error(message: string, context: Record<string, unknown> = {}): void {
        this.log.error(context, message);
    }
}
