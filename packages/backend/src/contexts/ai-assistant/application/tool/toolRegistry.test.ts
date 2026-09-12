import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from './toolRegistry.js';
import { defineTool } from './toolDescriptor.js';
import { AgentTool } from '../../domain/agentToolAggregate.js';
import { AgentToolId } from '../../domain/valueObject/agentToolId.js';
import { UserId } from '../../domain/valueObject/userId.js';
import { Name } from '../../domain/valueObject/name.js';
import { Permission, PermissionValue } from '../../domain/valueObject/permission.js';
import { Scope, ScopeValue } from '../../domain/valueObject/scope.js';
import { Token } from '../../domain/valueObject/token.js';
import { DomainException } from '@shared/domain/domainException.js';
import type { ILogger } from '@shared/application/port/iLogger.js';

// C'est le point où un agent IA atteint le métier. Deux choses s'y jouent et n'ont aucun
// autre garde-fou : un agent ne doit pas pouvoir *déduire* l'existence d'un outil hors de son
// périmètre, et une panne interne ne doit pas lui décrire l'infrastructure.

const silentLogger: ILogger = { info: () => {}, warn: () => {}, error: () => {} };
const context = { agentToolId: 'a1', userId: 'u1' };

function agent(scopes: ScopeValue[], permission: PermissionValue): AgentTool {
    return new AgentTool(
        new AgentToolId(),
        new UserId('u1'),
        new Name('agent'),
        new Permission(permission),
        scopes.map(scope => new Scope(scope)),
        new Token('hash'),
    );
}

function tool(name: string, scope: ScopeValue, access: 'read' | 'write', execute = async () => ({ ok: 1 })) {
    return defineTool({
        name,
        description: 'un outil',
        scope,
        access,
        inputSchema: z.object({ id: z.string() }),
        execute,
    });
}

function registry(...tools: ReturnType<typeof tool>[]): ToolRegistry {
    const instance = new ToolRegistry(silentLogger);
    instance.register(...tools);
    return instance;
}

describe('ToolRegistry — périmètre', () => {
    it('n’expose que les outils du périmètre de l’agent', () => {
        const instance = registry(
            tool('projects.list', ScopeValue.PROJECT, 'read'),
            tool('tickets.list', ScopeValue.TICKET, 'read'),
        );

        const visible = instance.listFor(agent([ScopeValue.PROJECT], PermissionValue.READ));

        expect(visible.map(t => t.name)).toEqual(['projects.list']);
    });

    it('cache les outils d’écriture à un agent en lecture seule', () => {
        const instance = registry(
            tool('projects.list', ScopeValue.PROJECT, 'read'),
            tool('projects.create', ScopeValue.PROJECT, 'write'),
        );

        const visible = instance.listFor(agent([ScopeValue.PROJECT], PermissionValue.READ));

        expect(visible.map(t => t.name)).toEqual(['projects.list']);
    });

    it('répond à un outil interdit comme à un outil inexistant', async () => {
        // L'agent ne doit pas pouvoir cartographier ce qui existe hors de son périmètre en
        // comparant les messages d'erreur.
        const instance = registry(tool('tickets.list', ScopeValue.TICKET, 'read'));
        const caller = agent([ScopeValue.PROJECT], PermissionValue.READ);

        const forbidden = await instance.execute('tickets.list', { id: 'x' }, caller, context);
        const unknown = await instance.execute('nexiste.pas', { id: 'x' }, caller, context);

        expect(forbidden.ok).toBe(false);
        expect(unknown.ok).toBe(false);
        if (forbidden.ok || unknown.ok) return;

        // Même code, et un message qui ne fait que répéter ce que l'agent a demandé : rien
        // dans la réponse ne permet de distinguer « existe mais interdit » de « n'existe pas ».
        expect(forbidden.error.code).toBe(unknown.error.code);
        expect(forbidden.error.code).toBe('unknown_tool');
        expect(forbidden.error.message).toBe('Unknown tool: tickets.list');
        expect(unknown.error.message).toBe('Unknown tool: nexiste.pas');
    });

    it('refuse deux outils portant le même nom', () => {
        const instance = new ToolRegistry(silentLogger);
        instance.register(tool('projects.list', ScopeValue.PROJECT, 'read'));

        expect(() => instance.register(tool('projects.list', ScopeValue.PROJECT, 'read'))).toThrow(
            'Duplicate tool registered: projects.list',
        );
    });
});

describe('ToolRegistry — exécution', () => {
    it('valide les arguments avant d’appeler quoi que ce soit', async () => {
        const execute = vi.fn(async () => ({ ok: 1 }));
        const instance = registry(tool('projects.get', ScopeValue.PROJECT, 'read', execute));

        const result = await instance.execute(
            'projects.get',
            { id: 42 },
            agent([ScopeValue.PROJECT], PermissionValue.READ),
            context,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('invalid_input');
        expect(execute).not.toHaveBeenCalled();
    });

    it('traduit une absence de résultat en « pas trouvé »', async () => {
        const instance = registry(
            tool('projects.get', ScopeValue.PROJECT, 'read', async () => null as unknown as { ok: number }),
        );

        const result = await instance.execute(
            'projects.get',
            { id: 'x' },
            agent([ScopeValue.PROJECT], PermissionValue.READ),
            context,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('not_found');
    });

    it('transmet le message d’une règle métier — le modèle peut se corriger', async () => {
        const instance = registry(
            tool('projects.create', ScopeValue.PROJECT, 'write', async () => {
                throw new DomainException('A project name cannot be empty');
            }),
        );

        const result = await instance.execute(
            'projects.create',
            { id: 'x' },
            agent([ScopeValue.PROJECT], PermissionValue.WRITE),
            context,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.message).toBe('A project name cannot be empty');
    });

    it('ne laisse pas fuir une panne technique vers l’agent', async () => {
        const logged: string[] = [];
        const instance = new ToolRegistry({ ...silentLogger, error: message => void logged.push(message) });
        instance.register(
            tool('projects.create', ScopeValue.PROJECT, 'write', async () => {
                throw new Error('connect ECONNREFUSED 10.0.0.5:5432');
            }),
        );

        const result = await instance.execute(
            'projects.create',
            { id: 'x' },
            agent([ScopeValue.PROJECT], PermissionValue.WRITE),
            context,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('execution_failed');
            expect(result.error.message).not.toContain('ECONNREFUSED');
            expect(result.error.message).not.toContain('10.0.0.5');
        }
        // La trace reste côté serveur, où elle sert au diagnostic.
        expect(logged).toHaveLength(1);
    });

    it('rend le résultat d’un appel valide', async () => {
        const instance = registry(tool('projects.get', ScopeValue.PROJECT, 'read', async () => ({ ok: 42 })));

        const result = await instance.execute(
            'projects.get',
            { id: 'x' },
            agent([ScopeValue.PROJECT], PermissionValue.READ),
            context,
        );

        expect(result).toEqual({ ok: true, data: { ok: 42 } });
    });
});
