import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// docker-compose.yml vit à la racine du monorepo ; `docker compose` doit être lancé depuis là,
// sinon il ne résout pas le projet et croit qu'aucun service n'existe.
const REPO_ROOT = fileURLToPath(new URL('../../../../../../', import.meta.url));

const SERVICE = 'postgres';

type PgCredentials = {
    user: string;
    password: string;
    database: string;
};

export function readPgCredentials(): PgCredentials {
    const user = process.env.POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD;
    const database = process.env.POSTGRES_DB;

    if (!user || !password || !database) {
        throw new Error('POSTGRES_USER, POSTGRES_PASSWORD and POSTGRES_DB are required for database import/export');
    }

    return { user, password, database };
}

// PGPASSWORD est passé par -e à `docker compose exec` : il n'apparaît donc pas dans la ligne de
// commande exécutée à l'intérieur du conteneur, contrairement à un mot de passe en argument.
function dockerArgs(credentials: PgCredentials, command: string[]): string[] {
    return ['compose', 'exec', '-T', '-e', `PGPASSWORD=${credentials.password}`, SERVICE, ...command];
}

function run(args: string[], stdin?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn('docker', args, { cwd: REPO_ROOT });

        let stdout = '';
        let stderr = '';
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', chunk => {
            stdout += chunk;
        });
        child.stderr.on('data', chunk => {
            stderr += chunk;
        });

        child.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') {
                reject(new Error('`docker` was not found in PATH — database import/export needs the Docker CLI'));
                return;
            }
            reject(error);
        });

        child.on('close', code => {
            if (code === 0) {
                resolve(stdout);
                return;
            }
            // Le cas de loin le plus fréquent : la base n'est pas démarrée. Le message brut de
            // docker ne le dit pas clairement, donc on le traduit.
            const hint = /is not running|no such service|not found/i.test(stderr)
                ? ' — is the database running? Try `make db-up`.'
                : '';
            reject(new Error(`docker compose exec ${SERVICE} failed (exit ${code})${hint}\n${stderr.trim()}`));
        });

        if (stdin !== undefined) {
            child.stdin.end(stdin);
        } else {
            child.stdin.end();
        }
    });
}

export async function pgDumpData(credentials: PgCredentials, excludedTables: string[]): Promise<string> {
    const command = [
        'pg_dump',
        '-U',
        credentials.user,
        '-d',
        credentials.database,
        '--data-only',
        '--no-owner',
        '--no-privileges',
        ...excludedTables.flatMap(table => ['--exclude-table-data', `public.${table}`]),
    ];

    return run(dockerArgs(credentials, command));
}

// ON_ERROR_STOP + -1 : le script entier est une transaction unique qui est annulée à la première
// erreur. C'est ce qui garantit qu'un import qui échoue ne laisse pas la base à moitié modifiée,
// ni le schéma de staging derrière lui.
export async function psqlScript(credentials: PgCredentials, sql: string): Promise<string> {
    const command = [
        'psql',
        '-U',
        credentials.user,
        '-d',
        credentials.database,
        '-v',
        'ON_ERROR_STOP=1',
        '-1',
        '-q',
        // -t -A : sortie sans en-tête ni alignement, pour que le rapport de fin d'import
        // arrive sur stdout comme une ligne JSON directement analysable.
        '-t',
        '-A',
        '-f',
        '-',
    ];

    return run(dockerArgs(credentials, command), sql);
}
