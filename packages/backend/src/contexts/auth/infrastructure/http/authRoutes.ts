import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { requireRole } from '@shared/infrastructure/http/roleGuard.js';
import fastifyOAuth2 from '@fastify/oauth2';
import { AllowedEmailRepository } from '../repository/allowedEmailRepository.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { CreateUserCommand } from '@contexts/user/application/command/createUser/createUserCommand.js';
import { GetUserByEmailQuery } from '@contexts/user/application/query/getUserByEmail/getUserByEmailQuery.js';
import { UserDto } from '@contexts/user/application/query/getUserById/userDto.js';

type AuthOpts = {
    commandBus: CommandBus;
    queryBus: QueryBus;
    allowedEmailRepo: AllowedEmailRepository;
};

interface OAuthSuccessParams {
    email: string;
    name: string;
    surname: string;
    reply: FastifyReply;
    repo: AllowedEmailRepository;
    commandBus: CommandBus;
    queryBus: QueryBus;
}

export const authRoutes: FastifyPluginAsync<AuthOpts> = async (app, { commandBus, queryBus, allowedEmailRepo }) => {

    // ── OAuth providers ────────────────────────────────────────────────────

    await app.register(fastifyOAuth2, {
        name: 'githubOAuth2',
        scope: ['user:email'],
        credentials: {
            client: { id: process.env.GITHUB_CLIENT_ID!, secret: process.env.GITHUB_CLIENT_SECRET! },
            auth: fastifyOAuth2.GITHUB_CONFIGURATION,
        },
        callbackUri: `${process.env.APP_URL}/auth/github/callback`,
    });

    await app.register(fastifyOAuth2, {
        name: 'googleOAuth2',
        scope: ['openid', 'email', 'profile'],
        credentials: {
            client: { id: process.env.GOOGLE_CLIENT_ID!, secret: process.env.GOOGLE_CLIENT_SECRET! },
            auth: fastifyOAuth2.GOOGLE_CONFIGURATION,
        },
        callbackUri: `${process.env.APP_URL}/auth/google/callback`,
    });

    // ── Routes de démarrage OAuth (enregistrées manuellement) ─────────────

    app.get('/auth/github', async (req, reply) => {
        const uri = await app.githubOAuth2.generateAuthorizationUri(req, reply);
        return reply.redirect(uri);
    });

    app.get('/auth/google', async (req, reply) => {
        const uri = await app.googleOAuth2.generateAuthorizationUri(req, reply);
        return reply.redirect(uri);
    });

    // ── GitHub callback ────────────────────────────────────────────────────

    app.get('/auth/github/callback', async (req, reply) => {
        const { token } = await app.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

        const emailsRes = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'atelier-portfolio' },
        });
        if (!emailsRes.ok) {
            req.log.error({ status: emailsRes.status }, 'GitHub emails API error');
            return reply.status(502).send({ error: 'GitHub API unavailable' });
        }
        const emails = await emailsRes.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
        if (!Array.isArray(emails)) return reply.status(502).send({ error: 'Unexpected GitHub response' });

        const email = emails.find(e => e.primary && e.verified)?.email ?? null;
        if (!email) return reply.status(400).send({ error: 'No verified primary email from GitHub' });

        const profileRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'atelier-portfolio' },
        });
        if (!profileRes.ok) return reply.status(502).send({ error: 'GitHub API unavailable' });
        const profile = await profileRes.json() as { name?: string | null; login: string };

        const displayName = profile.name ?? profile.login;
        const [name, ...rest] = displayName.split(' ');
        const surname = rest.join(' ') || name;

        return handleOAuthSuccess({ email, name, surname, reply, repo: allowedEmailRepo, commandBus, queryBus });
    });

    // ── Google callback ────────────────────────────────────────────────────

    app.get('/auth/google/callback', async (req, reply) => {
        const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${token.access_token}` },
        });
        if (!profileRes.ok) return reply.status(502).send({ error: 'Google API unavailable' });
        const profile = await profileRes.json() as { email: string; given_name: string; family_name?: string };

        return handleOAuthSuccess({
            email: profile.email,
            name: profile.given_name,
            surname: profile.family_name ?? profile.given_name,
            reply,
            repo: allowedEmailRepo,
            commandBus,
            queryBus,
        });
    });

    // ── Session courante ───────────────────────────────────────────────────────────

    app.get('/auth/me', async (req, reply) => {
        try {
            await req.jwtVerify();
            return reply.send({ id: req.user.sub, email: req.user.email, roles: req.user.roles });
        } catch {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // ── Whitelist API ──────────────────────────────────────────────────────────────

    app.get('/auth/allowed-emails', async (_req, reply) => {
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

    app.delete<{ Params: { email: string } }>('/auth/allowed-emails/:email', { preHandler: requireRole('edit') }, async (req, reply) => {
        await allowedEmailRepo.remove(req.params.email.toLowerCase());
        return reply.status(204).send();
    });
};

// ── Helper ─────────────────────────────────────────────────────────────────

async function handleOAuthSuccess({
    email, name, surname, reply, repo, commandBus, queryBus,
}: OAuthSuccessParams): Promise<void> {
    const normalizedEmail = email.toLowerCase();

    if (!(await repo.exists(normalizedEmail))) {
        return reply.status(401).send({ error: 'Email not authorized' });
    }

    let user = await queryBus.dispatch<GetUserByEmailQuery, UserDto | null>(
        new GetUserByEmailQuery(normalizedEmail),
    );

    if (!user) {
        const id = crypto.randomUUID();
        try {
            await commandBus.dispatch(new CreateUserCommand(id, name, surname, normalizedEmail, []));
        } catch (err: unknown) {
            // Race condition : un autre callback a provisionné l'utilisateur simultanément
            const msg = err instanceof Error ? err.message : '';
            if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
        }
        user = await queryBus.dispatch<GetUserByEmailQuery, UserDto | null>(
            new GetUserByEmailQuery(normalizedEmail),
        );
        if (!user) throw new Error('User provisioning failed');
    }

    const jwtToken = await reply.jwtSign({ sub: user.id, email: normalizedEmail, roles: user.roles });

    return reply
        .setCookie('session', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        })
        .redirect(process.env.FRONTEND_PRIVATE_URL ?? process.env.APP_URL ?? '/');
}
