const POLL_INTERVAL_MS = 3000;

type PairOptions = {
    apiUrl: string;
    name: string;
    scopes: string[];
    permission: string;
    onCode: (code: string) => void;
};

/**
 * Client side of the pairing flow: declares this agent, shows the code so it can be approved
 * in the admin screen, then waits for the token. Runs when no AGENT_TOOL_TOKEN is configured.
 */
export async function pairInteractively({ apiUrl, name, scopes, permission, onCode }: PairOptions): Promise<string> {
    const startRes = await fetch(`${apiUrl}/mcp/pair`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, scopes, permission }),
    });

    if (!startRes.ok) {
        throw new Error(`pairing refused (${startRes.status}): ${await startRes.text()}`);
    }

    const { code, expiresAt } = (await startRes.json()) as { code: string; expiresAt: string };
    onCode(code);

    const deadline = new Date(expiresAt).getTime();

    while (Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

        const claimRes = await fetch(`${apiUrl}/mcp/pair/claim`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ code }),
        });

        if (claimRes.status === 202) continue;
        if (!claimRes.ok) {
            throw new Error(`pairing failed (${claimRes.status}): ${await claimRes.text()}`);
        }

        const { token } = (await claimRes.json()) as { token: string };
        return token;
    }

    throw new Error('pairing code expired before it was approved');
}
