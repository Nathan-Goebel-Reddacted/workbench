import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { SubmitContactMessageCommand } from '@contexts/contact/application/command/submitContactMessage/submitContactMessageCommand';
import { ContactMessageError, isValidEmail } from '@contexts/contact/domain/contactMessageAggregate';

type Opts = { commandBus: CommandBus };

type SubmittedField = { label: string; value: string; type?: string };

type ContactBody = {
    fields: SubmittedField[];
    /** Honeypot: a real visitor never sees this input, so a filled one means a bot. */
    _hp?: string;
    /** Epoch ms captured when the form was rendered — used to reject instant submissions. */
    renderedAt?: number;
};

/** A human needs at least this long to fill a form; anything faster is scripted. */
const MIN_FILL_MS = 3000;

const bodySchema = {
    type: 'object',
    required: ['fields'],
    properties: {
        fields: {
            type: 'array',
            minItems: 1,
            maxItems: 20,
            items: {
                type: 'object',
                required: ['label', 'value'],
                properties: {
                    label: { type: 'string', maxLength: 200 },
                    value: { type: 'string', maxLength: 5000 },
                    type: { type: 'string' },
                },
            },
        },
        _hp: { type: 'string' },
        renderedAt: { type: 'number' },
    },
} as const;

/**
 * The only public write endpoint of the app: everything here assumes an unauthenticated,
 * possibly hostile caller. Spam is answered with a plain 200 so bots learn nothing.
 */
export const contactRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus }) => {
    app.post<{ Body: ContactBody }>(
        '/contact',
        {
            schema: { body: bodySchema },
            config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
        },
        async (req, reply) => {
            const { fields, _hp, renderedAt } = req.body;

            const tooFast = typeof renderedAt === 'number' && Date.now() - renderedAt < MIN_FILL_MS;
            if ((_hp && _hp.trim() !== '') || tooFast) {
                req.log.info({ reason: tooFast ? 'too-fast' : 'honeypot' }, 'contact submission dropped');
                return reply.send({ ok: true });
            }

            // The reply-to address is whichever email field the editor put on the form.
            const emailField = fields.find(f => f.type === 'email' && isValidEmail(f.value.trim()));
            const senderEmail = emailField ? emailField.value.trim() : null;

            try {
                await commandBus.dispatch(
                    new SubmitContactMessageCommand(
                        crypto.randomUUID(),
                        fields.map(f => ({ label: f.label, value: f.value })),
                        senderEmail,
                    ),
                );
            } catch (err) {
                if (err instanceof ContactMessageError) {
                    return reply.status(400).send({ error: err.message });
                }
                throw err;
            }

            return reply.send({ ok: true });
        },
    );
};
