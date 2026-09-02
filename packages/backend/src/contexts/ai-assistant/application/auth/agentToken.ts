import { randomBytes } from 'node:crypto';

const SEPARATOR = '.';
const SECRET_BYTES = 32;

export type AgentTokenParts = Readonly<{
    agentToolId: string;
    secret: string;
}>;

/**
 * Tokens are presented as `<agentToolId>.<secret>`.
 *
 * The secret is stored bcrypt-hashed, which makes it impossible to look up an agent from the
 * token alone. Carrying the id in the token gives us the row to verify against, so a call costs
 * one indexed lookup and a single bcrypt comparison instead of scanning the table.
 */
export function issueAgentToken(agentToolId: string): { secret: string; token: string } {
    const secret = randomBytes(SECRET_BYTES).toString('base64url');
    return { secret, token: `${agentToolId}${SEPARATOR}${secret}` };
}

export function parseAgentToken(presented: string): AgentTokenParts | null {
    const separatorIndex = presented.indexOf(SEPARATOR);
    if (separatorIndex <= 0) return null;

    const agentToolId = presented.slice(0, separatorIndex);
    const secret = presented.slice(separatorIndex + 1);
    if (!secret) return null;

    return { agentToolId, secret };
}
