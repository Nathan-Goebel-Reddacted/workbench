import { AgentToolId } from './valueObject/agentToolId';
import { UserId } from './valueObject/userId';
import { Name } from './valueObject/name';
import { Permission } from './valueObject/permission';
import { Scope } from './valueObject/scope';
import { Token } from './valueObject/token';
import { AgentToolMustKeepScopeException } from './exception/agentToolMustKeepScope';

export class AgentTool {
    private readonly id: AgentToolId;
    private readonly userId: UserId;
    private name: Name;
    private permission: Permission;
    private scopes: Scope[];
    private token: Token;
    private readonly createdAt: Date;
    private revokedAt: Date | null;

    constructor(
        id: AgentToolId,
        userId: UserId,
        name: Name,
        permission: Permission,
        scopes: Scope[],
        token: Token,
        createdAt: Date = new Date(),
        revokedAt: Date | null = null,
    ) {
        if (scopes.length === 0) {
            throw new AgentToolMustKeepScopeException();
        }
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.permission = permission;
        this.scopes = [...scopes];
        this.token = token;
        this.createdAt = createdAt;
        this.revokedAt = revokedAt;
    }

    getId(): AgentToolId {
        return this.id;
    }

    getUserId(): UserId {
        return this.userId;
    }

    getName(): Name {
        return this.name;
    }

    setName(name: Name): void {
        this.name = name;
    }

    getPermission(): Permission {
        return this.permission;
    }

    setPermission(permission: Permission): void {
        this.permission = permission;
    }

    getScopes(): Scope[] {
        return [...this.scopes];
    }

    addScope(scope: Scope): void {
        const alreadyExists = this.scopes.some(s => s.equals(scope));
        if (alreadyExists) return;
        this.scopes.push(scope);
    }

    removeScope(scope: Scope): void {
        if (this.scopes.length === 1 && this.scopes[0].equals(scope)) {
            throw new AgentToolMustKeepScopeException();
        }
        this.scopes = this.scopes.filter(s => !s.equals(scope));
    }

    getToken(): Token {
        return this.token;
    }

    async verifyToken(candidate: string): Promise<boolean> {
        return this.token.verify(candidate);
    }

    rotateToken(newToken: Token): void {
        this.token = newToken;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getRevokedAt(): Date | null {
        return this.revokedAt;
    }

    isRevoked(): boolean {
        return this.revokedAt !== null;
    }

    /** Denies the agent access without destroying it: the decision stays reversible. */
    revoke(): void {
        if (this.revokedAt !== null) return;
        this.revokedAt = new Date();
    }

    restore(): void {
        this.revokedAt = null;
    }
}
