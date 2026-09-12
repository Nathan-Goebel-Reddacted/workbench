import { Command } from './command';
import { ICommandHandler } from './iCommandHandler';

export class CommandBus {
    private readonly handlers = new Map<string, ICommandHandler<Command, unknown>>();

    register<C extends Command, R>(commandName: string, handler: ICommandHandler<C, R>): void {
        if (this.handlers.has(commandName)) {
            throw new Error(`Duplicate handler registered for: ${commandName}`);
        }
        this.handlers.set(commandName, handler as ICommandHandler<Command, unknown>);
    }

    /**
     * `R` vaut `void` par défaut : un appel non typé reste exactement ce qu'il était. Une
     * commande qui rend une valeur se dispatche avec ses deux paramètres — sans eux, la
     * valeur est ignorée, comme elle l'est déjà sur le bus de requêtes.
     */
    async dispatch<C extends Command, R = void>(command: C): Promise<R> {
        const handler = this.handlers.get(command.commandName);
        if (!handler) throw new Error(`No handler registered for: ${command.commandName}`);
        return handler.handle(command) as Promise<R>;
    }
}
