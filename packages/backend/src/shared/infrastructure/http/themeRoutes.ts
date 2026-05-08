import { FastifyPluginAsync } from 'fastify'
import { requireRole } from './roleGuard.js'
import { readThemeConfig, writeThemeConfig } from '@shared/infrastructure/theme/themeStore.js'

export const themeRoutes: FastifyPluginAsync = async (app) => {
    app.get('/theme', async (_req, reply) => {
        return reply.send({ customColors: readThemeConfig() })
    })

    app.patch<{ Body: { customColors: Record<string, string> } }>(
        '/theme',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['customColors'],
                    properties: { customColors: { type: 'object' } },
                },
            },
        },
        async (req, reply) => {
            writeThemeConfig(req.body.customColors)
            return reply.status(204).send()
        },
    )
}
