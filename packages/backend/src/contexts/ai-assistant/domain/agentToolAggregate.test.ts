import { describe, expect, it } from 'vitest';
import { AgentTool } from './agentToolAggregate.js';
import { AgentToolId } from './valueObject/agentToolId.js';
import { UserId } from './valueObject/userId.js';
import { Name } from './valueObject/name.js';
import { Permission, PermissionValue } from './valueObject/permission.js';
import { Scope, ScopeValue } from './valueObject/scope.js';
import { Token } from './valueObject/token.js';
import { AgentToolMustKeepScopeException } from './exception/agentToolMustKeepScope.js';
import { InvalidScopeException } from './exception/invalidScope.js';
import { InvalidPermissionException } from './exception/invalidPermission.js';

// Un AgentTool est une clé d'accès à l'API, délivrée à un agent. Ce qui se joue ici est le
// périmètre de cette clé : ce qu'elle peut atteindre (les scopes) et ce qu'elle peut y faire
// (la permission). Une clé sans scope ouvrirait tout ou rien selon l'implémentation du
// registre — c'est le genre d'ambiguïté qu'un agrégat doit rendre impossible.

function tool(scopes: string[] = [ScopeValue.PROJECT], permission: string = PermissionValue.READ): AgentTool {
    return new AgentTool(
        new AgentToolId(),
        new UserId('u1'),
        new Name('mon agent'),
        new Permission(permission),
        scopes.map(scope => new Scope(scope)),
        new Token('hash'),
    );
}

describe('AgentTool — scopes', () => {
    it('refuse de naître sans aucun scope', () => {
        expect(() => tool([])).toThrow(AgentToolMustKeepScopeException);
    });

    it('refuse de perdre son dernier scope', () => {
        const agent = tool([ScopeValue.PROJECT]);

        expect(() => agent.removeScope(new Scope(ScopeValue.PROJECT))).toThrow(AgentToolMustKeepScopeException);
        expect(agent.getScopes()).toHaveLength(1);
    });

    it('laisse retirer un scope tant qu’il en reste un', () => {
        const agent = tool([ScopeValue.PROJECT, ScopeValue.TICKET]);

        agent.removeScope(new Scope(ScopeValue.PROJECT));

        expect(agent.getScopes().map(s => s.getValue())).toEqual([ScopeValue.TICKET]);
    });

    it('ignore un scope déjà accordé plutôt que de le dupliquer', () => {
        const agent = tool([ScopeValue.PROJECT]);

        agent.addScope(new Scope(ScopeValue.PROJECT));

        expect(agent.getScopes()).toHaveLength(1);
    });

    it('rend une copie : modifier la liste rendue n’élargit pas le périmètre', () => {
        const agent = tool([ScopeValue.PROJECT]);

        agent.getScopes().push(new Scope(ScopeValue.TICKET));

        expect(agent.getScopes()).toHaveLength(1);
    });

    it('refuse un scope inconnu', () => {
        expect(() => new Scope('tout')).toThrow(InvalidScopeException);
    });
});

describe('AgentTool — permission', () => {
    it('distingue lecture et écriture', () => {
        expect(new Permission(PermissionValue.READ).canRead()).toBe(true);
        expect(new Permission(PermissionValue.READ).canWrite()).toBe(false);

        expect(new Permission(PermissionValue.WRITE).canWrite()).toBe(true);
        expect(new Permission(PermissionValue.WRITE).canRead()).toBe(false);

        expect(new Permission(PermissionValue.READ_WRITE).canRead()).toBe(true);
        expect(new Permission(PermissionValue.READ_WRITE).canWrite()).toBe(true);
    });

    it('refuse une permission inconnue', () => {
        expect(() => new Permission('admin')).toThrow(InvalidPermissionException);
    });
});

describe('AgentTool — révocation', () => {
    it('naît actif', () => {
        expect(tool().isRevoked()).toBe(false);
    });

    it('se révoque sans se détruire — la décision reste réversible', () => {
        const agent = tool();

        agent.revoke();

        expect(agent.isRevoked()).toBe(true);
        expect(agent.getRevokedAt()).toBeInstanceOf(Date);
    });

    it('ne réécrit pas la date d’une révocation déjà prononcée', () => {
        const agent = tool();
        agent.revoke();
        const first = agent.getRevokedAt();

        agent.revoke();

        expect(agent.getRevokedAt()).toBe(first);
    });

    it('se restaure', () => {
        const agent = tool();
        agent.revoke();

        agent.restore();

        expect(agent.isRevoked()).toBe(false);
        expect(agent.getRevokedAt()).toBeNull();
    });
});

describe('AgentTool — jeton', () => {
    it('refuse un jeton vide', () => {
        expect(() => new Token('   ')).toThrow();
    });

    it('remplace le jeton à la rotation', () => {
        const agent = tool();

        agent.rotateToken(new Token('nouveau-hash'));

        expect(agent.getToken().getValue()).toBe('nouveau-hash');
    });
});
