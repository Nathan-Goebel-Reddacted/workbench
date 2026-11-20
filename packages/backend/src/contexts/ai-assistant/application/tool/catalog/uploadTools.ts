import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { StoreUploadCommand } from '@shared/application/command/storeUpload/storeUploadCommand';
import { RewriteMindmapCommand } from '@shared/application/command/rewriteMindmap/rewriteMindmapCommand';
import { QueryBus } from '@shared/application/query/queryBus';
import { GetMindmapQuery } from '@shared/application/query/getMindmap/getMindmapQuery';
import { MAX_UPLOAD_BYTES } from '@shared/domain/valueObject/uploadFilename';
import { ANY_SCOPE, AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { UploadRateExceededException } from '../../../domain/exception/uploadRateExceeded';
import { mindmapSchema } from './sharedSchemas';

const MAX_BASE64_LENGTH = Math.ceil(MAX_UPLOAD_BYTES / 3) * 4;

const UPLOADS_PER_WINDOW = 60;
const WINDOW_MINUTES = 15;

const filenameOf = (url: string) => url.split('?')[0].split('/').pop() ?? '';

export function createUploadTools(
    commandBus: CommandBus,
    queryBus: QueryBus,
    now: () => number = Date.now,
): AnyToolDescriptor[] {
    const recentUploads = new Map<string, number[]>();

    const countUpload = (agentToolId: string) => {
        const since = now() - WINDOW_MINUTES * 60 * 1000;
        const recent = (recentUploads.get(agentToolId) ?? []).filter(at => at > since);
        if (recent.length >= UPLOADS_PER_WINDOW) {
            throw new UploadRateExceededException(UPLOADS_PER_WINDOW, WINDOW_MINUTES);
        }
        recentUploads.set(agentToolId, [...recent, now()]);
    };

    return [
        defineTool({
            name: 'upload_file',
            description:
                'Store a file on the site and get back its URL (/uploads/…). Then attach it with an add_*_document ' +
                'tool or use it as a page component source: a file nothing refers to is deleted after a while. ' +
                'Accepted: images (jpg, png, gif, webp, avif), videos (mp4, webm, mov…), pdf and mindmaps ' +
                `(.mindmap.json). svg is refused. At most ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB, and ` +
                `${UPLOADS_PER_WINDOW} uploads every ${WINDOW_MINUTES} minutes.`,
            scope: ANY_SCOPE,
            access: 'write',
            inputSchema: z.object({
                filename: z
                    .string()
                    .min(1)
                    .describe('Original file name; only its extension is kept, the stored name is generated.'),
                contentBase64: z
                    .base64()
                    .max(MAX_BASE64_LENGTH, `File too large (max ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB)`)
                    .describe('File content, base64-encoded.'),
            }),
            execute: async ({ filename, contentBase64 }, { agentToolId }) => {
                countUpload(agentToolId);
                const url = await commandBus.dispatch<StoreUploadCommand, string>(
                    new StoreUploadCommand(filename, Buffer.from(contentBase64, 'base64')),
                );
                return { url };
            },
        }),

        defineTool({
            name: 'get_mindmap',
            description:
                'Read the content of a mindmap (nodes and edges) from its URL, as found in the documents of a ' +
                'project, idea, feature or ticket. Read it before update_mindmap to change only part of it.',
            scope: ANY_SCOPE,
            access: 'read',
            inputSchema: z.object({
                url: z.string().min(1).describe("URL of the mindmap, ending with '.mindmap.json'."),
            }),
            execute: async ({ url }) => queryBus.dispatch(new GetMindmapQuery(filenameOf(url))),
        }),

        defineTool({
            name: 'update_mindmap',
            description:
                'Replace the whole content of an existing mindmap. Its URL does not change, so every document and ' +
                'page component pointing at it shows the new version.',
            scope: ANY_SCOPE,
            access: 'write',
            inputSchema: z.object({
                url: z.string().min(1).describe("URL of the mindmap, ending with '.mindmap.json'."),
                content: mindmapSchema,
            }),
            execute: async ({ url, content }) => {
                return {
                    url: await commandBus.dispatch<RewriteMindmapCommand, string>(
                        new RewriteMindmapCommand(filenameOf(url), content),
                    ),
                };
            },
        }),
    ];
}
