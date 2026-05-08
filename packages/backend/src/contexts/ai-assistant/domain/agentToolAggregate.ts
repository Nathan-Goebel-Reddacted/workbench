import { AgentToolId } from "./valueObject/agentToolId";
import { UserId } from "./valueObject/userId";
import { Name } from "./valueObject/name";
import { Permission } from "./valueObject/permission";
import { Scope } from "./valueObject/scope";
import { Token } from "./valueObject/token";

export class AgentTool {
    private readonly id: AgentToolId;
    private readonly userId: UserId;
    private name: Name;
    private permission: Permission;
    private scopes: Scope[];
    private token: Token;

    constructor(
        id: AgentToolId,
        userId: UserId,
        name: Name,
        permission: Permission,
        scopes: Scope[],
        token: Token
    ) {
        if (scopes.length === 0) {
            throw new Error('AgentTool must have at least one scope');
        }
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.permission = permission;
        this.scopes = [...scopes];
        this.token = token;
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
            throw new Error('AgentTool must have at least one scope');
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
}
