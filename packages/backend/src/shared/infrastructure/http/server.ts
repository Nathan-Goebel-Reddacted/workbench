import Fastify, { FastifyInstance } from 'fastify';
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
import { env } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createServer(orm: MikroORM): FastifyInstance {
    // Le JSON sur stdout est le bon format en conteneur : c'est le collecteur qui décide
    // de la destination, pas l'application.
    const app = Fastify({ logger: { level: env.LOG_LEVEL } });

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
    void app.register(fastifyStatic, {
        root: join(__dirname, '../../../../uploads'),
        prefix: '/uploads/',
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

    // Hook 2 : JWT guard (signature async — skip OAuth flow only)
    app.addHook('onRequest', async (req, reply) => {
        if (req.url.startsWith('/auth/github') || req.url.startsWith('/auth/google')) return;
        if (req.url.startsWith('/uploads/') && req.method === 'GET') return;
        // Sonde d'infrastructure : elle doit répondre avant toute considération de session.
        if (req.url === '/health') return;
        // /mcp authenticates agents with their own bearer token, not with a user session.
        if (req.url === '/mcp') return;
        // Pairing is how an agent obtains that token, so it cannot require one. Both endpoints
        // are safe without a session: they only ever create a request a human must approve.
        if (req.url === '/mcp/pair' || req.url === '/mcp/pair/claim') return;
        // Le formulaire de contact est rempli par des visiteurs anonymes : c'est la seule
        // mutation publique de l'API. Elle se défend par honeypot + délai + rate-limit,
        // pas par une session.
        if (req.url === '/contact' && req.method === 'POST') return;
        try {
            await req.jwtVerify();
            // Le jeton dit vrai au moment où il a été signé. La version de session dit s'il
            // le dit encore : un rôle retiré ou une déconnexion globale l'a fait avancer.
            const owner = await orm.em.findOne(UserOrmEntity, { id: req.user.sub }, { fields: ['tokenVersion'] });
            if (!owner || owner.tokenVersion !== (req.user.tv ?? 0)) {
                req.user = undefined as never;
                if (req.method === 'GET') return;
                return reply.status(401).send({ error: 'Session revoked' });
            }
        } catch {
            // Les lectures sont publiques : le site public consomme la même API que
            // l'administration. On poursuit en anonyme plutôt que de rejeter — req.user
            // reste absent, donc requireRole refuse toujours les GET d'administration.
            // Les mutations, elles, exigent une session.
            if (req.method === 'GET') return;
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // Liveness et readiness en une sonde : un backend qui ne joint plus sa base ne sert à
    // rien, et c'est exactement ce qu'un redémarrage automatique doit voir.
    app.get('/health', async (_req, reply) => {
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

        // Un 500 muet n'existait nulle part dans les logs : ce gestionnaire remplace celui de
        // Fastify, qui journalisait l'erreur. On la journalise donc ici, et on rend au client
        // l'identifiant de requête — le seul lien entre ce qu'il a vu et la trace serveur.
        req.log.error({ err: error, requestId: req.id }, 'Unhandled error');
        reply.status(500).send({ error: 'Internal server error', requestId: req.id });
    });

    return app;
}
