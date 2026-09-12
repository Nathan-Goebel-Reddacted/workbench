import Fastify, { FastifyBaseLogger, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { DomainException } from '@shared/domain/domainException';
import { UserOrmEntity } from '@contexts/user/infrastructure/entity/userOrmEntity';
import { CommandBus } from '@shared/application/command/commandBus';
import { RecordErrorLogEntryCommand } from '@contexts/errorLog/application/command/recordErrorLogEntry/recordErrorLogEntryCommand';
import { ErrorOrigin } from '@contexts/errorLog/domain/valueObject/errorOrigin';
import { env } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Une route déclare `config: { public: true }` quand elle doit répondre sans session.
 * Une URL inconnue n'a pas de `config` : elle est donc traitée comme gardée, ce qui est
 * le bon défaut — l'oubli ferme, il n'ouvre pas.
 */
function isPublicRoute(req: FastifyRequest): boolean {
    return req.routeOptions?.config?.public === true;
}

export function createServer(
    orm: MikroORM,
    commandBus: CommandBus,
    loggerInstance: FastifyBaseLogger,
): FastifyInstance {
    // Le logger est construit en amont et prêté à Fastify : les lignes émises avant que le
    // serveur n'existe et celles émises pendant une requête sortent ainsi au même format.
    const app = Fastify({ loggerInstance });

    const allowedOrigins = [env.FRONTEND_PUBLIC_URL, env.FRONTEND_PRIVATE_URL];

    void app.register(fastifyCors, {
        origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    // `global: false` : le plafond ne s'applique qu'aux routes qui le déclarent. Ce sont
    // celles qu'un anonyme peut atteindre — callbacks OAuth, appairage d'agent, /mcp —
    // et les écritures coûteuses.
    void app.register(fastifyRateLimit, { global: false });

    void app.register(fastifyMultipart);

    // `fastify-static` écrit son propre `config` et n'offre aucun moyen d'y ajouter le nôtre.
    // Un `onRoute` dans un périmètre encapsulé estampille ses routes à l'enregistrement :
    // les fichiers uploadés restent lisibles sans session, comme les pages qui les affichent.
    void app.register(async scope => {
        scope.addHook('onRoute', route => {
            route.config = { ...route.config, public: true };
        });
        await scope.register(fastifyStatic, {
            root: join(__dirname, '../../../../uploads'),
            prefix: '/uploads/',
        });
    });

    // fastifyCookie doit précéder fastifyJwt (requis pour la lecture du cookie session)
    void app.register(fastifyCookie);
    void app.register(fastifyJwt, {
        secret: env.JWT_SECRET,
        cookie: { cookieName: 'session', signed: false },
    });

    // Hook 1 : MikroORM context (signature callback — ordre intentionnel avant JWT)
    app.addHook('onRequest', (_req, _reply, done) => {
        RequestContext.create(orm.em, done);
    });

    // Hook 2 : JWT guard (signature async)
    //
    // Deux tiers coexistent, et les confondre ouvre ou ferme des accès en silence :
    //
    //  1. `config.public` — la route ne veut pas de session du tout. Le garde ne s'exécute
    //     pas : callbacks OAuth, /mcp (qui s'authentifie par son propre jeton), appairage
    //     d'agent, formulaire de contact, journal d'erreurs, sonde de santé, fichiers uploadés.
    //     Chaque route le déclare chez elle — plus de liste d'URLs à tenir ici.
    //
    //  2. La retombée anonyme des GET, plus bas — les lectures du site public passent par les
    //     mêmes routes que l'administration, et `requireRole` fait ensuite le tri.
    app.addHook('onRequest', async (req, reply) => {
        if (isPublicRoute(req)) return;

        // Aucun cookie présenté : visiteur anonyme, rien à vérifier ni à effacer.
        const presented = req.cookies?.session !== undefined;

        try {
            await req.jwtVerify();
            // Le jeton dit vrai au moment où il a été signé. La version de session dit s'il
            // le dit encore : un rôle retiré ou une déconnexion globale l'a fait avancer.
            const owner = await orm.em.findOne(UserOrmEntity, { id: req.user.sub }, { fields: ['tokenVersion'] });
            if (!owner || owner.tokenVersion !== (req.user.tv ?? 0)) {
                return refuseStaleSession(req, reply, 'Session revoked');
            }
        } catch {
            if (presented) return refuseStaleSession(req, reply, 'Unauthorized');

            // Sans cookie, une lecture reste possible : le site public consomme les mêmes
            // routes que l'administration, et `requireRole` fait ensuite le tri. Une mutation,
            // elle, exige une session.
            if (req.method === 'GET') return;
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    /**
     * Un cookie a été présenté mais ne vaut plus rien — expiré, signé sous une version de
     * session périmée, ou appartenant à un compte supprimé.
     *
     * Il est **effacé** : sans cela le navigateur le renvoie indéfiniment, et chaque requête
     * repayait une lecture en base pour reconstater la même chose.
     *
     * La lecture, elle, se poursuit en anonyme plutôt que d'être rejetée. `ThemeProvider`
     * interroge `GET /themes` avec `credentials: 'include'` depuis **les deux** frontends :
     * un 401 dur ferait perdre son thème au site public à tout visiteur ayant un jour eu une
     * session ici. Le frontend privé, lui, a `/auth/me` pour savoir où il en est.
     */
    function refuseStaleSession(req: FastifyRequest, reply: FastifyReply, reason: string) {
        req.user = undefined as never;
        void reply.clearCookie('session', { path: '/' });
        if (req.method === 'GET') return;
        return reply.status(401).send({ error: reason });
    }

    // Liveness et readiness en une sonde : un backend qui ne joint plus sa base ne sert à
    // rien, et c'est exactement ce qu'un redémarrage automatique doit voir.
    app.get('/health', { config: { public: true } }, async (_req, reply) => {
        try {
            await orm.em.getConnection().execute('select 1');
        } catch (err) {
            app.log.error({ err }, 'Health check failed: database unreachable');
            return reply.status(503).send({ status: 'unhealthy', database: 'unreachable' });
        }
        return reply.send({ status: 'ok', database: 'ok', uptime: Math.round(process.uptime()) });
    });

    app.setErrorHandler((error, req, reply) => {
        if (error instanceof NotFoundError) return reply.status(404).send({ error: error.message });
        if (error instanceof DomainException) return reply.status(400).send({ error: error.message });

        // Ce gestionnaire remplace celui de Fastify, qui honorait `statusCode`. Sans cette
        // branche, une requête malformée — corps hors schéma, JSON illisible, charge trop
        // grosse — devenait un 500 consigné au journal : l'appelant ne savait pas que c'était
        // sa faute, et n'importe qui pouvait remplir le journal en envoyant n'importe quoi.
        const clientError = error as Error & { statusCode?: number };
        const status = clientError.statusCode;
        if (status !== undefined && status >= 400 && status < 500) {
            return reply.status(status).send({ error: clientError.message });
        }

        // Un 500 muet n'existait nulle part dans les logs : on le journalise donc ici, et on
        // rend au client l'identifiant de requête — le seul lien entre ce qu'il a vu et la
        // trace serveur.
        req.log.error({ err: error, requestId: req.id }, 'Unhandled error');

        // Le journal ne doit jamais changer ce que voit l'appelant : la réponse part d'abord,
        // et un échec d'écriture reste un échec d'écriture — pas un second 500.
        reply.status(500).send({ error: 'Internal server error', requestId: req.id });

        const failure = error as Error & { statusCode?: number };
        void commandBus
            .dispatch(
                new RecordErrorLogEntryCommand(ErrorOrigin.BACK, failure.message, {
                    stack: failure.stack,
                    url: req.url,
                    userId: req.user?.sub ?? null,
                    correlationId: String(req.id),
                    context: { method: req.method, statusCode: failure.statusCode ?? 500 },
                }),
            )
            .catch(recordError => req.log.error({ err: recordError }, 'Failed to record error log entry'));
    });

    return app;
}
