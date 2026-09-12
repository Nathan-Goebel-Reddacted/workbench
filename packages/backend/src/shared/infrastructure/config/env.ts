import './loadEnvFile.js';
import { z } from 'zod';

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

const required = z
    .string({ error: 'variable requise, absente de l’environnement' })
    .trim()
    .min(1, 'variable requise, mais vide');
const optional = z.string().trim().default('');

const PLACEHOLDER_SECRETS = ['change_me', 'changeme', 'change-me', 'secret', 'test-secret'];

const jwtSecret = required
    .min(32, 'au moins 32 caractères : un secret court se retrouve par force brute hors ligne')
    .refine(
        value => !PLACEHOLDER_SECRETS.includes(value.toLowerCase()),
        'valeur d’exemple — générer un secret propre : ' +
            `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
    );

const schema = z.object({
    JWT_SECRET: jwtSecret,
    APP_URL: required,
    // Les deux origines sont les seules acceptées par CORS (server.ts). Une valeur de repli y
    // ferait passer le site public pour une origine étrangère en production, sans un mot dans
    // les logs : elles sont donc requises, pas défaultées.
    FRONTEND_PUBLIC_URL: required,
    FRONTEND_PRIVATE_URL: required,

    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().trim().default('0.0.0.0'),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
    SESSION_TTL: z.string().trim().default('7d'),
    ALLOW_INSECURE_COOKIE: z
        .string()
        .trim()
        .default('')
        .transform(value => value === 'true'),

    BOOTSTRAP_ADMIN_EMAIL: optional,
    CONTACT_MAIL_TO: optional,

    // Validés par paire plus bas : un fournisseur à moitié configuré est traité comme absent.
    GITHUB_CLIENT_ID: optional,
    GITHUB_CLIENT_SECRET: optional,
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
});

export type OAuthProvider = 'github' | 'google';

export type OAuthCredentials = {
    provider: OAuthProvider;
    clientId: string;
    clientSecret: string;
};

export type Env = z.infer<typeof schema> & {
    oauth: OAuthCredentials[];
};

function readOAuth(values: z.infer<typeof schema>): { credentials: OAuthCredentials[]; partial: string[] } {
    const pairs: Array<[OAuthProvider, string, string]> = [
        ['github', values.GITHUB_CLIENT_ID, values.GITHUB_CLIENT_SECRET],
        ['google', values.GOOGLE_CLIENT_ID, values.GOOGLE_CLIENT_SECRET],
    ];

    const credentials: OAuthCredentials[] = [];
    const partial: string[] = [];

    for (const [provider, clientId, clientSecret] of pairs) {
        if (clientId && clientSecret) {
            credentials.push({ provider, clientId, clientSecret });
        } else if (clientId || clientSecret) {
            partial.push(provider);
        }
    }

    return { credentials, partial };
}

function parseEnv(source: NodeJS.ProcessEnv): { env: Env; warnings: string[] } {
    const parsed = schema.safeParse(source);

    // Toutes les variables manquantes d'un coup : corriger un .env une ligne par redémarrage est
    // le meilleur moyen d'abandonner à la troisième.
    if (!parsed.success) {
        const details = parsed.error.issues
            .map(issue => `  - ${issue.path.join('.') || '(racine)'} : ${issue.message}`)
            .join('\n');

        throw new Error(`Configuration invalide — corriger le .env :\n${details}`);
    }

    const { credentials, partial } = readOAuth(parsed.data);

    // Sans fournisseur, l'espace privé n'a aucune porte d'entrée et le premier administrateur ne
    // peut jamais se connecter : mieux vaut refuser de démarrer que servir une application close.
    if (credentials.length === 0) {
        throw new Error(
            'Configuration invalide — aucun fournisseur OAuth complet. Renseigner au moins une ' +
                'paire GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET ou GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.',
        );
    }

    const warnings = partial.map(
        provider =>
            `OAuth ${provider} ignoré : une seule des deux variables ${provider.toUpperCase()}_CLIENT_ID / ` +
            `${provider.toUpperCase()}_CLIENT_SECRET est renseignée.`,
    );

    const missing = (['github', 'google'] as OAuthProvider[]).filter(
        provider => !credentials.some(c => c.provider === provider) && !partial.includes(provider),
    );
    warnings.push(...missing.map(provider => `OAuth ${provider} non configuré : le bouton ne sera pas proposé.`));

    return { env: { ...parsed.data, oauth: credentials }, warnings };
}

const result = parseEnv(process.env);

export const env: Env = result.env;

// Émis par index.ts une fois le logger disponible : la validation, elle, doit tourner avant que
// quoi que ce soit d'autre ne démarre.
export const envWarnings: string[] = result.warnings;

export function isOAuthEnabled(provider: OAuthProvider): boolean {
    return env.oauth.some(credentials => credentials.provider === provider);
}

// À n'appeler que sous `isOAuthEnabled` : l'absence est une erreur de programmation, pas une
// configuration à rattraper au vol.
export function oauthCredentials(provider: OAuthProvider): OAuthCredentials {
    const found = env.oauth.find(credentials => credentials.provider === provider);
    if (!found) throw new Error(`OAuth provider "${provider}" is not configured`);
    return found;
}
