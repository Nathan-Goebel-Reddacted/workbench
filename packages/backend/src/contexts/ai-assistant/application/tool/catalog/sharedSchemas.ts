import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const linkSchema = z.object({
    url: z.string().describe('Absolute URL the link points to.'),
    displayText: z.string().describe('Label shown to visitors instead of the raw URL.'),
    logo: z.string().describe('Logo identifier or URL shown next to the link. Empty string if none.'),
});

export const documentSchema = z.object({
    name: z.string().describe('Human-readable file name shown in the interface.'),
    url: z
        .string()
        .describe(
            'URL the document is served from: absolute, or the /uploads/… path returned by upload_file. Its kind (pdf, image, video, mindmap) is derived from it; ' +
                "a mindmap URL ends with '.mindmap.json'.",
        ),
});

const mindmapColorSchema = z
    .enum(['default', 'primary', 'muted', 'red', 'orange', 'green', 'blue', 'purple'])
    .describe('Color token resolved by the theme, never a CSS value.');

export const mindmapSchema = z
    .object({
        version: z.literal(2),
        nodes: z.array(
            z
                .object({
                    id: z.string().min(1),
                    kind: z
                        .enum(['mind', 'free', 'shape'])
                        .describe('mind: tree node linkable by edges; free: floating note; shape: decorative shape.'),
                    text: z.string(),
                    x: z.number().describe('Position in pixels; nodes are usually 150 to 250 px apart.'),
                    y: z.number(),
                    w: z.number().positive().optional(),
                    h: z.number().positive().optional(),
                    color: mindmapColorSchema.optional(),
                    fill: z.enum(['none', 'surface', 'color']).optional(),
                    fontSize: z.number().positive().optional(),
                    bold: z.boolean().optional(),
                    shape: z.enum(['rectangle', 'ellipse', 'arrow']).optional().describe('Only for kind shape.'),
                    rotation: z.number().optional().describe('Degrees, only for an arrow shape.'),
                })
                .passthrough(),
        ),
        edges: z.array(
            z
                .object({
                    id: z.string().min(1),
                    source: z.string().describe('Id of a mind node.'),
                    target: z.string().describe('Id of a mind node.'),
                    label: z.string().optional(),
                    color: mindmapColorSchema.optional(),
                    path: z.enum(['bezier', 'straight', 'step']).optional(),
                    stroke: z.enum(['solid', 'dashed']).optional(),
                    arrow: z.boolean().optional(),
                })
                .passthrough(),
        ),
    })
    .passthrough()
    .describe('Mindmap content, as drawn by the mindmap editor.');

export type LinkInput = z.infer<typeof linkSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;

/** Documents are identified by a server-generated id: callers never provide one. */
export function withGeneratedIds(documents: DocumentInput[]): Array<DocumentInput & { id: string }> {
    return documents.map(document => ({ ...document, id: crypto.randomUUID() }));
}
