import { z, ZodType } from 'zod';
import { ScopeValue } from '../../domain/valueObject/scope';

/**
 * Whether calling a tool requires read or write permission on its scope.
 * Maps onto Permission.canRead() / Permission.canWrite().
 */
export type ToolAccess = 'read' | 'write';

/** Identity of the agent behind a tool call, resolved from its token by the transport layer. */
export type ToolContext = Readonly<{
    agentToolId: string;
    userId: string;
}>;

export type ToolErrorCode = 'unknown_tool' | 'forbidden' | 'invalid_input' | 'not_found' | 'execution_failed';

export type ToolError = Readonly<{
    code: ToolErrorCode;
    message: string;
}>;

/**
 * Outcome of a tool call, transport-agnostic: the MCP adapters are responsible
 * for turning it into their own wire format.
 */
export type ToolResult = Readonly<{ ok: true; data: unknown }> | Readonly<{ ok: false; error: ToolError }>;

/**
 * A business action exposed to an AI agent.
 *
 * The description is read by the model to decide whether to call the tool: it is
 * product content, not a technical comment. State what the tool does, what it
 * returns, and when not to use it.
 */
export interface ToolDescriptor<TInput extends ZodType = ZodType> {
    readonly name: string;
    readonly description: string;
    readonly scope: ScopeValue;
    readonly access: ToolAccess;
    readonly inputSchema: TInput;
    execute(input: z.infer<TInput>, context: ToolContext): Promise<unknown>;
}

/**
 * A descriptor with its input type erased, for storage in the registry.
 * Concrete input types are unified behind runtime validation, so the registry
 * never needs to know them.
 */
export type AnyToolDescriptor = ToolDescriptor<ZodType>;

/** Preserves input type inference in execute() while declaring a tool. */
export function defineTool<TInput extends ZodType>(descriptor: ToolDescriptor<TInput>): AnyToolDescriptor {
    return descriptor as AnyToolDescriptor;
}

/** JSON Schema advertised to MCP clients — derived from the zod schema, never written twice. */
export function toolInputJsonSchema(descriptor: AnyToolDescriptor): Record<string, unknown> {
    return z.toJSONSchema(descriptor.inputSchema, { io: 'input' }) as Record<string, unknown>;
}
