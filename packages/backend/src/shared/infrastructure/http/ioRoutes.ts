import { FastifyPluginAsync } from 'fastify';
import { MikroORM } from '@mikro-orm/postgresql';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requireRole } from './roleGuard.js';
import { exportDatabase, importDatabase } from '../io/databaseIoService.js';
import { ioPortPath, latestDump, listDumps, readDump, writeDump } from '../io/ioPortFiles.js';
import { archiveNameFor, createUploadsArchive, extractUploadsArchive } from '../io/uploadsArchive.js';
import { buildZip, dateStamp, readZipEntries, writeBackupZip } from '../io/backupArchive.js';
import { createExportBundle } from '../io/exportBundle.js';

// Un dump complet des 13 tables reste petit, mais les colonnes JSON (documents, links, layouts)
// grossissent sans plafond : le défaut de Fastify (1 Mo) serait atteint bien avant que le dump
// ne devienne réellement gros.
const MAX_DUMP_BYTES = 64 * 1024 * 1024;

const EXPORT_TARGETS = ['download', 'ioport', 'backup'] as const;
type ExportTarget = (typeof EXPORT_TARGETS)[number];

function isExportTarget(value: unknown): value is ExportTarget {
    return typeof value === 'string' && (EXPORT_TARGETS as readonly string[]).includes(value);
}

type IoRoutesOptions = { orm: MikroORM };

// Deux routes pour tous les bounded contexts : la liste des tables est dérivée des métadonnées
// MikroORM, donc une nouvelle entité y entre sans toucher à ce fichier.
export const ioRoutes: FastifyPluginAsync<IoRoutesOptions> = async (app, { orm }) => {
    // Le corps d'un import est du SQL, pas du JSON — sans ce parseur Fastify rejetterait la
    // requête en 415 avant d'atteindre le handler.
    app.addContentTypeParser(
        ['text/plain', 'application/sql'],
        { parseAs: 'string', bodyLimit: MAX_DUMP_BYTES },
        (_req, body, done) => done(null, body),
    );

    app.addContentTypeParser('application/zip', { parseAs: 'buffer', bodyLimit: MAX_DUMP_BYTES }, (_req, body, done) =>
        done(null, body),
    );

    app.post<{ Body?: { target?: string } }>('/io/export', { preHandler: requireRole('edit') }, async (req, reply) => {
        const requested = req.body?.target ?? 'download';
        if (!isExportTarget(requested)) {
            return reply.code(400).send({ message: `Unknown export target: ${requested}` });
        }

        // ioPort/ reçoit le dump et l'archive côte à côte, sans zip englobant : c'est cette
        // disposition que `make db-import` et /io/import savent apparier.
        if (requested === 'ioport') {
            const { filename, sql } = await exportDatabase(orm);
            await writeDump(filename, sql);
            const uploads = await createUploadsArchive(ioPortPath(archiveNameFor(filename)));

            return reply.send({ target: requested, filename, uploads });
        }

        const bundle = await createExportBundle(orm);
        try {
            if (requested === 'backup') {
                const filename = await writeBackupZip(bundle.entries);
                return reply.send({ target: requested, filename, uploads: bundle.uploads });
            }

            const folder = dateStamp();
            return reply
                .header('content-type', 'application/zip')
                .header('content-disposition', `attachment; filename="${folder}.zip"`)
                .send(buildZip(folder, bundle.entries));
        } finally {
            await bundle.dispose();
        }
    });

    // Trois façons de désigner ce qu'on importe : un zip complet, le SQL dans le corps, ou le nom
    // d'un fichier déjà déposé dans ioPort/.
    app.post<{ Body: Buffer | string | { file?: string }; Querystring: { dryRun?: string } }>(
        '/io/import',
        { preHandler: requireRole('edit'), bodyLimit: MAX_DUMP_BYTES },
        async (req, reply) => {
            // Une simulation joue l'import et rend son rapport, puis annule tout : c'est le seul
            // moyen de savoir ce qu'un dump ferait à cette base-ci sans le lui faire.
            const dryRun = req.query.dryRun === '1' || req.query.dryRun === 'true';

            let dump: string;
            let source: string;
            let uploadsRestored = false;

            if (Buffer.isBuffer(req.body)) {
                const entries = readZipEntries(req.body);
                const sqlName = [...entries.keys()].find(name => name.endsWith('.sql'));
                if (!sqlName) {
                    return reply.code(400).send({ message: 'No .sql file inside the archive' });
                }

                dump = entries.get(sqlName)!.toString('utf8');
                source = sqlName;

                const archiveName = [...entries.keys()].find(name => name.endsWith('.tar.gz'));
                // Une simulation ne touche à rien : tar écrit sur le disque et ne s'annule pas
                // avec la transaction.
                if (archiveName && !dryRun) {
                    const dir = await mkdtemp(join(tmpdir(), 'atelier-import-'));
                    try {
                        const archivePath = join(dir, archiveName);
                        await writeFile(archivePath, entries.get(archiveName)!);
                        uploadsRestored = await extractUploadsArchive(archivePath);
                    } finally {
                        await rm(dir, { recursive: true, force: true });
                    }
                }
            } else if (typeof req.body === 'string' && req.body.trim().length > 0) {
                dump = req.body;
                source = 'request body';
            } else {
                const requested = (req.body as { file?: string } | undefined)?.file;
                const filename = requested ?? (await latestDump());
                dump = await readDump(filename);
                source = `ioPort/${filename}`;
                // Un dump envoyé dans le corps n'a pas de nom, donc pas d'archive à apparier :
                // les médias ne suivent que par le mode « fichier déposé dans ioPort/ ».
                uploadsRestored = dryRun ? false : await extractUploadsArchive(ioPortPath(archiveNameFor(filename)));
            }

            // Le point de retour est pris avant d'écrire quoi que ce soit : un import qui tourne
            // mal laisse toujours de quoi revenir en arrière, sans que personne ait eu à y penser.
            let backup: string | null = null;
            if (!dryRun) {
                const bundle = await createExportBundle(orm);
                try {
                    backup = await writeBackupZip(bundle.entries);
                } finally {
                    await bundle.dispose();
                }
            }

            const report = await importDatabase(orm, dump, { dryRun });

            return reply.send({
                source,
                dryRun,
                backup,
                uploadsRestored,
                tables: report.map(row => ({
                    table: row.table_name,
                    inserted: Number(row.inserted),
                    updated: Number(row.updated),
                })),
            });
        },
    );

    // Sans cette route, l'appelant de /io/import ne peut pas savoir quels dumps sont déposés.
    app.get('/io/dumps', { preHandler: requireRole('edit') }, async () => ({ dumps: await listDumps() }));
};
