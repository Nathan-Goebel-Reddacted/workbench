import { Command } from './command';
import { ICommandHandler } from './iCommandHandler';

export class CommandBus {
    private readonly handlers = new Map<string, ICommandHandler<Command>>();

    register<C extends Command>(commandName: string, handler: ICommandHandler<C>): void {
        if (this.handlers.has(commandName)) {
            throw new Error(`Duplicate handler registered for: ${commandName}`);
        }
        this.handlers.set(commandName, handler as ICommandHandler<Command>);
    }

    async dispatch<C extends Command>(command: C): Promise<void> {
        const handler = this.handlers.get(command.commandName);
        if (!handler) throw new Error(`No handler registered for: ${command.commandName}`);
        await handler.handle(command);
    }
}
