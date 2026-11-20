import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyBaseLogger, FastifyInstance, RouteOptions } from 'fastify';
import type { MikroORM } from '@mikro-orm/postgresql';
import pino from 'pino';
import { CommandBus } from './shared/application/command/commandBus.js';
import type { QueryBus } from './shared/application/query/queryBus.js';
import type { RouteBuses } from './routes.js';

// Le garde de session laisse passer toute lecture anonyme : le site public lit les mêmes
// routes que l'administration, et c'est la garde de chaque route qui fait le tri. Une route
// `GET` qui l'oublie est donc ouverte à tous, sans que rien ne casse. Chaque `GET` monté doit
// refuser un visiteur anonyme, ou dire explicitement qu'il lui est destiné.

vi.mock('@mikro-orm/core', async importOriginal => {
    const actual = await importOriginal<typeof import('@mikro-orm/core')>();
    return {
        ...actual,
        RequestContext: { create: (_em: unknown, done: () => void) => done() },
    };
});

process.env.LOG_LEVEL = 'fatal';
process.env.JWT_SECRET ??= '0'.repeat(64);
process.env.APP_URL ??= 'http://localhost:3000';
process.env.FRONTEND_PUBLIC_URL ??= 'http://localhost:5173';
process.env.FRONTEND_PRIVATE_URL ??= 'http://localhost:5174';

/**
 * Les fichiers uploadés sont servis par le plugin statique, qui ne porte pas de `config` :
 * le site public les lit par la retombée anonyme des GET, choix documenté dans `server.ts`.
 */
const EXEMPT = ['/uploads/*'];

const UUID = '11111111-1111-4111-8111-111111111111';

type JsonSchema = {
    properties?: Record<string, { enum?: string[]; format?: string; type?: string }>;
    required?: string[];
};

function sample(schema: { enum?: string[]; format?: string; type?: string } | undefined): string {
    if (schema?.enum?.length) return schema.enum[0];
    if (schema?.format === 'uuid') return UUID;
    if (schema?.type === 'number' || schema?.type === 'integer') return '1';
    if (schema?.type === 'boolean') return 'true';
    return 'x';
}

function requestUrl(route: RouteOptions): string {
    const params = (route.schema?.params as JsonSchema | undefined)?.properties ?? {};
    const path = route.url
        .replace(/:(\w+)/g, (_match, name: string) => sample(params[name] ?? { format: 'uuid' }))
        .replace('*', 'x');
    const query = route.schema?.querystring as JsonSchema | undefined;
    const search = new URLSearchParams(
        (query?.required ?? []).map(name => [name, sample(query?.properties?.[name])]),
    ).toString();
    return search ? `${path}?${search}` : path;
}

let app: FastifyInstance;
const routes: RouteOptions[] = [];

beforeAll(async () => {
    const { createServer } = await import('./shared/infrastructure/http/server.js');
    const { registerRoutes } = await import('./routes.js');
    const orm = { em: {} } as unknown as MikroORM;
    const commandBus = new CommandBus();
    const buses = {
        commandBus,
        queryBus: { dispatch: async () => null } as unknown as QueryBus,
        toolRegistry: {},
        agentAuthenticator: {},
    } as unknown as RouteBuses;

    app = createServer(orm, commandBus, pino({ level: 'silent' }) as unknown as FastifyBaseLogger, async () => true);
    app.addHook('onRoute', route => {
        if (route.method === 'GET' || (Array.isArray(route.method) && route.method.includes('GET'))) {
            routes.push(route);
        }
    });
    await registerRoutes(app, buses, orm);
    await app.ready();
});

describe('lecture anonyme', () => {
    it('monte des routes GET à vérifier', () => {
        expect(routes.length).toBeGreaterThan(10);
    });

    it('refuse un visiteur anonyme sur chaque GET qui ne se déclare pas ouvert', async () => {
        const open: string[] = [];

        for (const route of routes) {
            if (route.config?.public === true || route.config?.anonymousRead === true) continue;
            if (EXEMPT.includes(route.url)) continue;
            const url = requestUrl(route);
            const res = await app.inject({ method: 'GET', url });
            if (res.statusCode !== 401 && res.statusCode !== 403) open.push(`GET ${route.url} → ${res.statusCode}`);
        }

        expect(open).toEqual([]);
    });
});
