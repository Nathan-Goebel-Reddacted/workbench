import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Dossier d'échange à la racine du monorepo : on y dépose les dumps à importer, les exports y
// atterrissent. Son contenu est gitignoré.
export const IO_PORT_DIR = fileURLToPath(new URL('../../../../../../ioPort/', import.meta.url));

export function ioPortPath(filename: string): string {
    return join(IO_PORT_DIR, basename(filename));
}

export async function writeDump(filename: string, sql: string): Promise<string> {
    await mkdir(IO_PORT_DIR, { recursive: true });
    await writeFile(join(IO_PORT_DIR, filename), sql, 'utf8');
    return filename;
}

export async function readDump(filename: string): Promise<string> {
    return readFile(await resolveDumpPath(filename), 'utf8');
}

export async function listDumps(): Promise<string[]> {
    const entries = await readdir(IO_PORT_DIR).catch(() => [] as string[]);
    // Les noms d'export sont horodatés, donc l'ordre alphabétique est l'ordre chronologique.
    return entries.filter(name => name.endsWith('.sql')).sort();
}

export async function latestDump(): Promise<string> {
    const dumps = await listDumps();
    if (dumps.length === 0) {
        throw new Error('No .sql file found in ioPort/ — drop the dump to import there first');
    }
    return dumps[dumps.length - 1];
}

// ioPort est un dossier d'échange, pas un chemin libre : ne garder que le nom de fichier évite
// qu'un `file=../../.env` fasse lire n'importe quoi.
export async function resolveDumpPath(requested: string): Promise<string> {
    const target = resolve(IO_PORT_DIR, basename(requested));
    if (!target.startsWith(resolve(IO_PORT_DIR))) {
        throw new Error('The dump must live directly inside ioPort/');
    }
    return target;
}
