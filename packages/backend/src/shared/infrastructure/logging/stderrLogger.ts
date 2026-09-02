import { ILogger } from '@shared/application/port/iLogger.js';

/**
 * Pour le serveur MCP en stdio : stdout porte le flux JSON-RPC, donc tout diagnostic doit
 * sortir sur stderr sous peine de corrompre le protocole.
 */
export class StderrLogger implements ILogger {
    constructor(private readonly prefix: string) {}

    info(message: string, context: Record<string, unknown> = {}): void {
        this.write('info', message, context);
    }

    warn(message: string, context: Record<string, unknown> = {}): void {
        this.write('warn', message, context);
    }

    error(message: string, context: Record<string, unknown> = {}): void {
        this.write('error', message, context);
    }

    private write(level: string, message: string, context: Record<string, unknown>): void {
        const suffix = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
        console.error(`[${this.prefix}] ${level}: ${message}${suffix}`);
    }
}
