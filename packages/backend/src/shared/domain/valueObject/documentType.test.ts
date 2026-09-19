import { describe, expect, it } from 'vitest';
import { DocumentType, documentTypeFromUrl } from './documentType.js';
import { Document } from '../entity/document.js';
import { DocumentId } from './documentId.js';

describe('documentTypeFromUrl', () => {
    it.each([
        ['/uploads/plan.mindmap.json', DocumentType.MINDMAP],
        ['/uploads/SPEC.PDF', DocumentType.PDF],
        ['/uploads/schema.png?v=2', DocumentType.IMAGE],
        ['https://cdn.example.com/demo.webm', DocumentType.VIDEO],
        ['/uploads/data.json', DocumentType.FILE],
        ['/uploads/rapport.docx', DocumentType.FILE],
        ['https://www.youtube.com/watch?v=abc', DocumentType.FILE],
    ])('%s → %s', (url, expected) => {
        expect(documentTypeFromUrl(url)).toBe(expected);
    });
});

describe('Document', () => {
    it('derives its type from its url', () => {
        const document = new Document(new DocumentId(), 'Schéma', '/uploads/schema.png');

        expect(document.getType()).toBe(DocumentType.IMAGE);
    });
});
