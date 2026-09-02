import { DomainException } from '@shared/domain/domainException';
import { AgentTool } from '../../domain/agentToolAggregate';
import { AnyToolDescriptor, ToolContext, ToolErrorCode, ToolResult } from './toolDescriptor';
import { ILogger } from '@shared/application/port/iLogger';

function failure(code: ToolErrorCode, message: string): ToolResult {
    return { ok: false, error: { code, message } };
}

/**
 * Holds every business action exposed to AI agents and enforces, on each call,
 * the scopes and permission carried by the calling AgentTool.
 */
export class ToolRegistry {
    private readonly tools = new Map<string, AnyToolDescriptor>();

    constructor(private readonly logger: ILogger) {}

    register(...descriptors: AnyToolDescriptor[]): void {
        for (const descriptor of descriptors) {
            if (this.tools.has(descriptor.name)) {
                throw new Error(`Duplicate tool registered: ${descriptor.name}`);
            }
            this.tools.set(descriptor.name, descriptor);
        }
    }

    /** Tools the agent may see and call, given its scopes and permission. */
    listFor(agent: AgentTool): AnyToolDescriptor[] {
        return [...this.tools.values()].filter(tool => this.isAllowed(tool, agent));
    }

    async execute(name: string, rawInput: unknown, agent: AgentTool, context: ToolContext): Promise<ToolResult> {
        const tool = this.tools.get(name);

        // Unknown and forbidden are answered identically on purpose: an agent must not
        // be able to probe which tools exist outside of the scopes it was granted.
        if (!tool || !this.isAllowed(tool, agent)) {
            return failure('unknown_tool', `Unknown tool: ${name}`);
        }

        const parsed = tool.inputSchema.safeParse(rawInput);
        if (!parsed.success) {
            const issues = parsed.error.issues
                .map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
                .join('; ');
            return failure('invalid_input', `Invalid arguments for ${name}. ${issues}`);
        }

        try {
            const data = await tool.execute(parsed.data, context);
            if (data === null || data === undefined) {
                return failure('not_found', `${name} found no matching record.`);
            }
            return { ok: true, data };
        } catch (error) {
            return failure('execution_failed', this.describeFailure(name, error));
        }
    }

    private isAllowed(tool: AnyToolDescriptor, agent: AgentTool): boolean {
        const inScope = agent.getScopes().some(scope => scope.getValue() === tool.scope);
        if (!inScope) return false;

        const permission = agent.getPermission();
        return tool.access === 'read' ? permission.canRead() : permission.canWrite();
    }

    /**
     * Domain exceptions carry actionable business messages and are safe to forward:
     * they let the model correct its own input. Anything else may leak infrastructure
     * details, so it is logged server-side and reported generically.
     */
    private describeFailure(name: string, error: unknown): string {
        if (error instanceof DomainException) {
            return error.message;
        }
        this.logger.error(`MCP tool "${name}" failed`, {
            tool: name,
            err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        });
        return `The tool ${name} failed to execute.`;
    }
}
