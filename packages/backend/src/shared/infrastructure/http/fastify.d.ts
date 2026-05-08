import { OAuth2Namespace } from '@fastify/oauth2';

declare module 'fastify' {
    interface FastifyInstance {
        githubOAuth2: OAuth2Namespace;
        googleOAuth2: OAuth2Namespace;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { sub: string; email: string; roles: string[] };
        user:    { sub: string; email: string; roles: string[] };
    }
}
