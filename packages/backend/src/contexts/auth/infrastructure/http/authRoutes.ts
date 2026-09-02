import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { requireRole } from '@shared/infrastructure/http/roleGuard.js';
import fastifyOAuth2 from '@fastify/oauth2';
import { AllowedEmailRepository, EmailAlreadyAllowedException } from '../repository/allowedEmailRepository.js';
import { AccessRequestRepository } from '../repository/accessRequestRepository.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { CreateUserCommand } from '@contexts/user/application/command/createUser/createUserCommand.js';
import { InvalidateUserSessionsCommand } from '@contexts/user/application/command/invalidateUserSessions/invalidateUserSessionsCommand.js';
import { GetUserByEmailQuery } from '@contexts/user/application/query/getUserByEmail/getUserByEmailQuery.js';
import { UserDto } from '@contexts/user/application/query/getUserById/userDto.js';
import { UserRole } from '@contexts/user/domain/valueObject/role.js';
import { bootstrapAdminEmail } from '../bootstrapAdmin.js';
import { env, isOAuthEnabled, oauthCredentials } from '@shared/infrastructure/config/env.js';

// Un jeton sans expiration reste valable pour toujours : le vol du cookie n'a alors
// aucune fin naturelle. Sept jours par défaut, ajustable sans redéploiement.
const SESSION_TTL = env.SESSION_TTL;

// Le cookie porte la session : sur HTTP en clair il voyage lisible. Il est donc `secure`
// dès qu'on n'est pas explicitement en développement local — `NODE_ENV` seul ne suffisait
// pas, docker-compose le force à `development` y compris sur un déploiement distant.
function sessionCookieOptions() {
    const insecureAllowed = env.ALLOW_INSECURE_COOKIE;
    return {
        httpOnly: true,
        secure: !insecureAllowed,
        sameSite: 'lax' as const,
        path: '/',
    };
}

type AuthOpts = {
    commandBus: CommandBus;
    queryBus: QueryBus;
    allowedEmailRepo: AllowedEmailRepository;
    accessRequestRepo: AccessRequestRepository;
};

interface OAuthSuccessParams {
    email: string;
    name: string;
    surname: string;
    reply: FastifyReply;
    repo: AllowedEmailRepository;
    accessRequestRepo: AccessRequestRepository;
    commandBus: CommandBus;
    queryBus: QueryBus;
}

export const authRoutes: FastifyPluginAsync<AuthOpts> = async (
    app,
    { commandBus, queryBus, allowedEmailRepo, accessRequestRepo },
) => {
    // ── OAuth providers ────────────────────────────────────────────────────

    // Un fournisseur n'existe que si sa paire d'identifiants est complète (cf. env.ts, qui refuse
    // de démarrer si aucun ne l'est). Enregistrement, route de départ et callback vont ensemble :
    // déclarer la route sans le décorateur laisserait `app.githubOAuth2` à `undefined` et rendrait
    // un 500 opaque au visiteur.

    // Atteignables sans session : ce sont les seules portes ouvertes de l'authentification.
    const oauthRateLimit = { config: { rateLimit: { max: 20, timeWindow: '15 minutes' } } };

    // Le site privé n'a pas à deviner ce qui est configuré : il dessine ses boutons à partir d'ici.
    app.get('/auth/providers', async () => ({ providers: env.oauth.map(credentials => credentials.provider) }));

    if (isOAuthEnabled('github')) {
        const credentials = oauthCredentials('github');

        await app.register(fastifyOAuth2, {
            name: 'githubOAuth2',
            scope: ['user:email'],
            credentials: {
                client: { id: credentials.clientId, secret: credentials.clientSecret },
                auth: fastifyOAuth2.GITHUB_CONFIGURATION,
            },
            callbackUri: `${env.APP_URL}/auth/github/callback`,
        });

        app.get('/auth/github', oauthRateLimit, async (req, reply) => {
            const uri = await app.githubOAuth2.generateAuthorizationUri(req, reply);
            return reply.redirect(uri);
        });

        app.get('/auth/github/callback', oauthRateLimit, async (req, reply) => {
            const { token } = await app.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

            const emailsRes = await fetch('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'atelier-portfolio' },
            });
            if (!emailsRes.ok) {
                req.log.error({ status: emailsRes.status }, 'GitHub emails API error');
                return reply.status(502).send({ error: 'GitHub API unavailable' });
            }
            const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
            if (!Array.isArray(emails)) return reply.status(502).send({ error: 'Unexpected GitHub response' });

            const email = emails.find(e => e.primary && e.verified)?.email ?? null;
            if (!email) return reply.status(400).send({ error: 'No verified primary email from GitHub' });

            const profileRes = await fetch('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'atelier-portfolio' },
            });
            if (!profileRes.ok) return reply.status(502).send({ error: 'GitHub API unavailable' });
            const profile = (await profileRes.json()) as { name?: string | null; login: string };

            const displayName = profile.name ?? profile.login;
            const [name, ...rest] = displayName.split(' ');
            const surname = rest.join(' ') || name;

            return handleOAuthSuccess({
                email,
                name,
                surname,
                reply,
                repo: allowedEmailRepo,
                accessRequestRepo,
                commandBus,
                queryBus,
            });
        });
    }

    if (isOAuthEnabled('google')) {
        const credentials = oauthCredentials('google');

        await app.register(fastifyOAuth2, {
            name: 'googleOAuth2',
            scope: ['openid', 'email', 'profile'],
            credentials: {
                client: { id: credentials.clientId, secret: credentials.clientSecret },
                auth: fastifyOAuth2.GOOGLE_CONFIGURATION,
            },
            callbackUri: `${env.APP_URL}/auth/google/callback`,
        });

        app.get('/auth/google', oauthRateLimit, async (req, reply) => {
            const uri = await app.googleOAuth2.generateAuthorizationUri(req, reply);
            return reply.redirect(uri);
        });

        app.get('/auth/google/callback', oauthRateLimit, async (req, reply) => {
            const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

            const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${token.access_token}` },
            });
            if (!profileRes.ok) return reply.status(502).send({ error: 'Google API unavailable' });
            const profile = (await profileRes.json()) as { email: string; given_name: string; family_name?: string };

            return handleOAuthSuccess({
                email: profile.email,
                name: profile.given_name,
                surname: profile.family_name ?? profile.given_name,
                reply,
                repo: allowedEmailRepo,
                accessRequestRepo,
                commandBus,
                queryBus,
            });
        });
    }

    // ── Session courante ───────────────────────────────────────────────────────────

    app.get('/auth/me', async (req, reply) => {
        try {
            await req.jwtVerify();
            return reply.send({ id: req.user.sub, email: req.user.email, roles: req.user.roles });
        } catch {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // Le cookie est `httpOnly` : le navigateur ne peut pas l'effacer lui-même, seule une
    // réponse du serveur le peut. Sans cette route, se déconnecter était impossible.
    app.post('/auth/logout', async (_req, reply) => {
        return reply.clearCookie('session', { path: '/' }).status(204).send();
    });

    // Coupe toutes les sessions du compte, y compris celles ouvertes ailleurs — c'est la
    // réponse à un cookie que l'on croit volé.
    app.post('/auth/logout-everywhere', async (req, reply) => {
        try {
            await req.jwtVerify();
        } catch {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        await commandBus.dispatch(new InvalidateUserSessionsCommand(req.user.sub));
        return reply.clearCookie('session', { path: '/' }).status(204).send();
    });

    // ── Whitelist API ──────────────────────────────────────────────────────────────

    // Who is allowed in is administration data, like the requests and the roles beside it.
    app.get('/auth/allowed-emails', { preHandler: requireRole('edit') }, async (_req, reply) => {
        const emails = await allowedEmailRepo.findAll();
        return reply.send({ emails });
    });

    app.post<{ Body: { email: string } }>(
        '/auth/allowed-emails',
        {
            preHandler: requireRole('edit'),
            schema: { body: { type: 'object', required: ['email'], properties: { email: { type: 'string' } } } },
        },
        async (req, reply) => {
            await allowedEmailRepo.add(req.body.email.toLowerCase());
            return reply.status(201).send();
        },
    );

    app.delete<{ Params: { email: string } }>(
        '/auth/allowed-emails/:email',
        { preHandler: requireRole('edit') },
        async (req, reply) => {
            await allowedEmailRepo.remove(req.params.email.toLowerCase());
            return reply.status(204).send();
        },
    );

    // ── Demandes d'accès ───────────────────────────────────────────────────────────

    app.get('/auth/access-requests', { preHandler: requireRole('edit') }, async (_req, reply) => {
        const requests = await accessRequestRepo.findAll();
        return reply.send({ requests });
    });

    app.post<{ Params: { email: string } }>(
        '/auth/access-requests/:email/approve',
        { preHandler: requireRole('edit') },
        async (req, reply) => {
            const email = req.params.email.toLowerCase();
            const exists = await accessRequestRepo.setStatus(email, 'approved');
            if (!exists) return reply.status(404).send({ error: 'Access request not found' });

            // Approving only whitelists the email: the user account is provisioned on next login.
            try {
                await allowedEmailRepo.add(email);
            } catch (err: unknown) {
                if (!(err instanceof EmailAlreadyAllowedException)) throw err;
            }
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { email: string } }>(
        '/auth/access-requests/:email/reject',
        { preHandler: requireRole('edit') },
        async (req, reply) => {
            const exists = await accessRequestRepo.setStatus(req.params.email.toLowerCase(), 'rejected');
            if (!exists) return reply.status(404).send({ error: 'Access request not found' });
            return reply.status(204).send();
        },
    );
};

// ── Helper ─────────────────────────────────────────────────────────────────

async function handleOAuthSuccess({
    email,
    name,
    surname,
    reply,
    repo,
    accessRequestRepo,
    commandBus,
    queryBus,
}: OAuthSuccessParams): Promise<void> {
    const normalizedEmail = email.toLowerCase();

    if (!(await repo.exists(normalizedEmail))) {
        // The provider already verified this email, so the request carries a real identity.
        const status = await accessRequestRepo.record(normalizedEmail, `${name} ${surname}`.trim() || normalizedEmail);
        const frontend = env.FRONTEND_PRIVATE_URL;
        return reply.redirect(`${frontend}/access-requested?status=${status}`);
    }

    let user = await queryBus.dispatch<GetUserByEmailQuery, UserDto | null>(new GetUserByEmailQuery(normalizedEmail));

    if (!user) {
        const id = crypto.randomUUID();
        // Le compte d'amorçage doit naître utilisable : sans ce rôle, la première connexion
        // sur une base vierge produit un compte incapable d'ouvrir la whitelist à qui que
        // ce soit, y compris à lui-même.
        // `view` est le rôle de base de la partie privée : un compte whitelisté sans rôle
        // se connecterait pour ne rien pouvoir lire. L'accès a déjà été accordé en amont,
        // par l'ajout de l'email à la whitelist.
        const roles = normalizedEmail === bootstrapAdminEmail() ? [UserRole.EDIT] : [UserRole.VIEW];
        try {
            await commandBus.dispatch(new CreateUserCommand(id, name, surname, normalizedEmail, roles));
        } catch (err: unknown) {
            // Race condition : un autre callback a provisionné l'utilisateur simultanément
            const msg = err instanceof Error ? err.message : '';
            if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
        }
        user = await queryBus.dispatch<GetUserByEmailQuery, UserDto | null>(new GetUserByEmailQuery(normalizedEmail));
        if (!user) throw new Error('User provisioning failed');
    }

    const jwtToken = await reply.jwtSign(
        { sub: user.id, email: normalizedEmail, roles: user.roles, tv: user.tokenVersion },
        { expiresIn: SESSION_TTL },
    );

    return reply.setCookie('session', jwtToken, sessionCookieOptions()).redirect(env.FRONTEND_PRIVATE_URL);
}
