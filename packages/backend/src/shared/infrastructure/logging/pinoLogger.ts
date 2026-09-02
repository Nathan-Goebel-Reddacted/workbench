import { FastifyBaseLogger } from 'fastify';
import { ILogger } from '@shared/application/port/iLogger.js';

export class PinoLogger implements ILogger {
    constructor(private readonly log: FastifyBaseLogger) {}

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
