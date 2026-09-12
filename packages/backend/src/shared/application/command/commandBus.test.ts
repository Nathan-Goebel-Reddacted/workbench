import { describe, expect, it } from 'vitest';
import { CommandBus } from './commandBus.js';
import { Command } from './command.js';
import { ICommandHandler } from './iCommandHandler.js';

class SilentCommand implements Command {
    static readonly commandName = 'test.silent';
    readonly commandName = SilentCommand.commandName;
    constructor(readonly value: string) {}
}

/** Écrit dans son propre registre : la forme historique, qui ne rend rien. */
class SilentHandler implements ICommandHandler<SilentCommand> {
    readonly seen: string[] = [];
    async handle(command: SilentCommand): Promise<void> {
        this.seen.push(command.value);
    }
}

type Provisioned = { id: string; roles: string[] };

class ProvisionCommand implements Command {
    static readonly commandName = 'test.provision';
    readonly commandName = ProvisionCommand.commandName;
    constructor(readonly email: string) {}
}

/** La forme nouvelle : l'appelant a besoin de ce qui vient d'être créé. */
class ProvisionHandler implements ICommandHandler<ProvisionCommand, Provisioned> {
    async handle(command: ProvisionCommand): Promise<Provisioned> {
        return { id: `id-for-${command.email}`, roles: ['view'] };
    }
}

describe('CommandBus', () => {
    it('exécute un handler historique sans rien rendre', async () => {
        const bus = new CommandBus();
        const handler = new SilentHandler();
        bus.register(SilentCommand.commandName, handler);

        const result = await bus.dispatch(new SilentCommand('a'));

        expect(handler.seen).toEqual(['a']);
        expect(result).toBeUndefined();
    });

    it('rend la valeur produite par un handler typé', async () => {
        const bus = new CommandBus();
        bus.register(ProvisionCommand.commandName, new ProvisionHandler());

        const user = await bus.dispatch<ProvisionCommand, Provisioned>(new ProvisionCommand('a@b.c'));

        expect(user).toEqual({ id: 'id-for-a@b.c', roles: ['view'] });
    });

    it('refuse deux handlers pour une même commande', () => {
        const bus = new CommandBus();
        bus.register(SilentCommand.commandName, new SilentHandler());

        expect(() => bus.register(SilentCommand.commandName, new SilentHandler())).toThrow(
            'Duplicate handler registered for: test.silent',
        );
    });

    it('refuse une commande sans handler', async () => {
        const bus = new CommandBus();

        await expect(bus.dispatch(new SilentCommand('a'))).rejects.toThrow('No handler registered for: test.silent');
    });

    it('laisse remonter l’échec du handler sans le transformer', async () => {
        const bus = new CommandBus();
        bus.register(SilentCommand.commandName, {
            handle: async () => {
                throw new Error('règle métier refusée');
            },
        } satisfies ICommandHandler<SilentCommand>);

        await expect(bus.dispatch(new SilentCommand('a'))).rejects.toThrow('règle métier refusée');
    });
});
