import { AgentTool } from '../agentToolAggregate';
import { AgentToolId } from '../valueObject/agentToolId';
import { UserId } from '../valueObject/userId';
import { Name } from '../valueObject/name';
import { Permission } from '../valueObject/permission';
import { Scope } from '../valueObject/scope';
import { Token } from '../valueObject/token';

export class AgentToolFactory {
    async create(
        id: string,
        userId: string,
        name: string,
        permission: string,
        scopes: string[],
        rawToken: string,
    ): Promise<AgentTool> {
        const token = await Token.hash(rawToken);
        return new AgentTool(
            new AgentToolId(id),
            new UserId(userId),
            new Name(name),
            new Permission(permission),
            scopes.map(s => new Scope(s)),
            token,
        );
    }
}
