import { z } from 'zod';
import { DocumentType } from '@shared/domain/valueObject/documentType';

export const uuidSchema = z.string().uuid();

export const linkSchema = z.object({
    url: z.string().describe('Absolute URL the link points to.'),
    displayText: z.string().describe('Label shown to visitors instead of the raw URL.'),
    logo: z.string().describe('Logo identifier or URL shown next to the link. Empty string if none.'),
});

export const documentSchema = z.object({
    name: z.string().describe('Human-readable file name shown in the interface.'),
    url: z.string().describe('Absolute URL the document is served from.'),
    type: z
        .enum(DocumentType)
        .describe(
            "Kind of media: 'pdf', 'image', 'video' or 'mindmap'. It drives how the document is rendered. " +
                "A 'mindmap' is a JSON schema authored inside the application; its URL ends with '.mindmap.json'.",
        ),
});

export type LinkInput = z.infer<typeof linkSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;

/** Documents are identified by a server-generated id: callers never provide one. */
export function withGeneratedIds(documents: DocumentInput[]): Array<DocumentInput & { id: string }> {
    return documents.map(document => ({ ...document, id: crypto.randomUUID() }));
}
