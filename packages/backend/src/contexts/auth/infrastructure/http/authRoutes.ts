import { FastifyPluginAsync, FastifyReply } from 'fastify';
import fastifyOAuth2 from '@fastify/oauth2';
import { requireRole } from '@shared/infrastructure/http/roleGuard.js';
import { UserRole } from '@shared/domain/valueObject/userRole.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { InvalidateUserSessionsCommand } from '@contexts/user/application/command/invalidateUserSessions/invalidateUserSessionsCommand.js';
import {
    ProvisionOutcome,
    ProvisionUserFromOAuthCommand,
} from '../../application/command/provisionUserFromOAuth/provisionUserFromOAuthCommand.js';
import { AddAllowedEmailCommand } from '../../application/command/addAllowedEmail/addAllowedEmailCommand.js';
import { RemoveAllowedEmailCommand } from '../../application/command/removeAllowedEmail/removeAllowedEmailCommand.js';
import { ApproveAccessRequestCommand } from '../../application/command/approveAccessRequest/approveAccessRequestCommand.js';
import { RejectAccessRequestCommand } from '../../application/command/rejectAccessRequest/rejectAccessRequestCommand.js';
import { ListAllowedEmailsQuery } from '../../application/query/listAllowedEmails/listAllowedEmailsQuery.js';
import { ListAccessRequestsQuery } from '../../application/query/listAccessRequests/listAccessRequestsQuery.js';
import { AccessRequestDto } from '../../application/query/listAccessRequests/accessRequestDto.js';
import { env, isOAuthEnabled, oauthCredentials } from '@shared/infrastructure/config/env.js';

// Ce fichier ne décide plus rien. Il échange un code contre un profil chez le fournisseur,
// passe le résultat au bus, et traduit ce qu'on lui rend en cookie ou en redirection.
// Qui a le droit d'entrer, avec quel rôle, et ce qu'il advient d'une demande d'accès se
// décide dans `auth/domain` et `auth/application`.

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
};

type OAuthProfile = { email: string; name: string; surname: string };

export const authRoutes: FastifyPluginAsync<AuthOpts> = async (app, { commandBus, queryBus }) => {
    /**
     * Le seul endroit où une identité vérifiée devient une session. La décision vient du bus ;
     * ici on ne fait que poser le cookie ou rediriger vers l'écran d'attente.
     */
    async function completeLogin(profile: OAuthProfile, reply: FastifyReply): Promise<void> {
        const outcome = await commandBus.dispatch<ProvisionUserFromOAuthCommand, ProvisionOutcome>(
            new ProvisionUserFromOAuthCommand(profile.email, profile.name, profile.surname),
        );

        if (outcome.kind === 'accessRequested') {
            return reply.redirect(`${env.FRONTEND_PRIVATE_URL}/access-requested?status=${outcome.status}`);
        }

        const { user } = outcome;
        const jwtToken = await reply.jwtSign(
            { sub: user.id, email: user.email, roles: user.roles, tv: user.tokenVersion },
            { expiresIn: SESSION_TTL },
        );
        return reply.setCookie('session', jwtToken, sessionCookieOptions()).redirect(env.FRONTEND_PRIVATE_URL);
    }

    // ── OAuth providers ────────────────────────────────────────────────────

    // Un fournisseur n'existe que si sa paire d'identifiants est complète (cf. env.ts, qui refuse
    // de démarrer si aucun ne l'est). Enregistrement, route de départ et callback vont ensemble :
    // déclarer la route sans le décorateur laisserait `app.githubOAuth2` à `undefined` et rendrait
    // un 500 opaque au visiteur.

    // Atteignables sans session : ce sont les seules portes ouvertes de l'authentification.
    const oauthRateLimit = { config: { public: true, rateLimit: { max: 20, timeWindow: '15 minutes' } } };

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

            return completeLogin({ email, name, surname }, reply);
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

            return completeLogin(
                {
                    email: profile.email,
                    name: profile.given_name,
                    surname: profile.family_name ?? profile.given_name,
                },
                reply,
            );
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
    app.get('/auth/allowed-emails', { preHandler: requireRole(UserRole.EDIT) }, async (_req, reply) => {
        const emails = await queryBus.dispatch<ListAllowedEmailsQuery, string[]>(new ListAllowedEmailsQuery());
        return reply.send({ emails });
    });

    app.post<{ Body: { email: string } }>(
        '/auth/allowed-emails',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: { body: { type: 'object', required: ['email'], properties: { email: { type: 'string' } } } },
        },
        async (req, reply) => {
            await commandBus.dispatch(new AddAllowedEmailCommand(req.body.email));
            return reply.status(201).send();
        },
    );

    app.delete<{ Params: { email: string } }>(
        '/auth/allowed-emails/:email',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            await commandBus.dispatch(new RemoveAllowedEmailCommand(req.params.email));
            return reply.status(204).send();
        },
    );

    // ── Demandes d'accès ───────────────────────────────────────────────────────────

    app.get('/auth/access-requests', { preHandler: requireRole(UserRole.EDIT) }, async (_req, reply) => {
        const requests = await queryBus.dispatch<ListAccessRequestsQuery, AccessRequestDto[]>(
            new ListAccessRequestsQuery(),
        );
        return reply.send({ requests });
    });

    app.post<{ Params: { email: string } }>(
        '/auth/access-requests/:email/approve',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            await commandBus.dispatch(new ApproveAccessRequestCommand(req.params.email));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { email: string } }>(
        '/auth/access-requests/:email/reject',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            await commandBus.dispatch(new RejectAccessRequestCommand(req.params.email));
            return reply.status(204).send();
        },
    );
};
