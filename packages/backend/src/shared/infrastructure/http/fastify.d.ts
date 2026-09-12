import { OAuth2Namespace } from '@fastify/oauth2';

declare module 'fastify' {
    interface FastifyInstance {
        githubOAuth2: OAuth2Namespace;
        googleOAuth2: OAuth2Namespace;
    }

    /**
     * Déclaré ici pour que `config: { public: true }` soit vérifié à la compilation : une
     * faute de frappe dans le nom du drapeau laisserait sinon la route gardée en silence.
     */
    interface FastifyContextConfig {
        public?: boolean;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { sub: string; email: string; roles: string[]; tv: number };
        user: { sub: string; email: string; roles: string[]; tv?: number };
    }
}
