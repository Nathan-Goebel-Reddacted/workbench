import { spawn } from 'node:child_process';
import { access, mkdir, readdir } from 'node:fs/promises';
import { basename, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Même dossier que celui servi par uploadRoutes : la base ne stocke que des URLs `/uploads/...`,
// les octets vivent ici. Transporter l'un sans l'autre donne des documents en 404.
const UPLOADS_DIR = fileURLToPath(new URL('../../../../uploads/', import.meta.url));

// L'archive porte le nom du dump : c'est ce qui permet de les apparier à l'import sans avoir à
// mémoriser une association ailleurs.
export function archiveNameFor(dumpFilename: string): string {
    return `${dumpFilename.replace(/\.sql$/i, '')}.uploads.tar.gz`;
}

// GNU tar lit `G:\...` comme « hôte G, chemin ... » et tente une connexion distante. On ne lui
// passe donc jamais de chemin absolu : tar tourne depuis le dossier de l'archive, et le dossier
// des uploads est désigné en relatif, avec des séparateurs POSIX que les deux tars acceptent.
function toPosixRelative(from: string, to: string): string {
    return relative(from, to).split('\\').join('/') || '.';
}

function runTar(args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn('tar', args, { cwd });

        let stderr = '';
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', chunk => {
            stderr += chunk;
        });

        child.on('error', (error: NodeJS.ErrnoException) => {
            reject(
                error.code === 'ENOENT'
                    ? new Error('`tar` was not found in PATH — needed to carry the uploads folder')
                    : error,
            );
        });

        child.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error(`tar failed (exit ${code})\n${stderr.trim()}`));
        });
    });
}

export async function countUploads(): Promise<number> {
    const entries = await readdir(UPLOADS_DIR).catch(() => [] as string[]);
    return entries.length;
}

/** Renvoie le nombre de fichiers archivés, ou 0 si le dossier est vide ou absent. */
export async function createUploadsArchive(archivePath: string): Promise<number> {
    const count = await countUploads();
    if (count === 0) return 0;

    const workingDir = dirname(archivePath);
    // `-C uploads .` archive le contenu sans le dossier parent : l'extraction retombe donc
    // directement dans uploads/, quel que soit le chemin absolu de la machine d'origine.
    await runTar(['-czf', basename(archivePath), '-C', toPosixRelative(workingDir, UPLOADS_DIR), '.'], workingDir);
    return count;
}

/** Renvoie false si aucune archive n'accompagne le dump. */
export async function extractUploadsArchive(archivePath: string): Promise<boolean> {
    try {
        await access(archivePath);
    } catch {
        return false;
    }

    await mkdir(UPLOADS_DIR, { recursive: true });
    const workingDir = dirname(archivePath);
    // tar écrase les fichiers de même nom et laisse les autres en place : c'est le pendant, côté
    // fichiers, de l'upsert appliqué aux lignes — rien n'est supprimé.
    await runTar(['-xzf', basename(archivePath), '-C', toPosixRelative(workingDir, UPLOADS_DIR)], workingDir);
    return true;
}
