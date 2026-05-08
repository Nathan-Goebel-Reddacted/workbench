import Fastify, { FastifyInstance } from 'fastify';
import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { DomainException } from '@shared/domain/domainException';

export function createServer(orm: MikroORM): FastifyInstance {
    const app = Fastify({ logger: true });

    const allowedOrigins = [
        process.env.FRONTEND_PUBLIC_URL  ?? 'http://localhost:5173',
        process.env.FRONTEND_PRIVATE_URL ?? 'http://localhost:5174',
    ];

    void app.register(fastifyCors, {
        origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    // fastifyCookie doit précéder fastifyJwt (requis pour la lecture du cookie session)
    void app.register(fastifyCookie);
    void app.register(fastifyJwt, {
        secret: process.env.JWT_SECRET!,
        cookie: { cookieName: 'session', signed: false },
    });

    // Hook 1 : MikroORM context (signature callback — ordre intentionnel avant JWT)
    app.addHook('onRequest', (_req, _reply, done) => {
        RequestContext.create(orm.em, done);
    });

    // Hook 2 : JWT guard (signature async — skip OAuth flow only)
    app.addHook('onRequest', async (req, reply) => {
        if (req.url.startsWith('/auth/github') || req.url.startsWith('/auth/google')) return;
        if (req.url === '/theme' && req.method === 'GET') return;
        try {
            await req.jwtVerify();
        } catch {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    app.setErrorHandler((error, _req, reply) => {
        if (error instanceof NotFoundError)
            return reply.status(404).send({ error: error.message });
        if (error instanceof DomainException)
            return reply.status(400).send({ error: error.message });
        reply.status(500).send({ error: 'Internal server error' });
    });

    return app;
}
