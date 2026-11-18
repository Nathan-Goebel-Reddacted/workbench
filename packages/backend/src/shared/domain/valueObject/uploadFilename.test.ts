import { describe, expect, it } from 'vitest';
import { assertStoredMindmapName, storableExtension } from './uploadFilename.js';
import { UnsupportedFileTypeException } from '../exception/unsupportedFileType.js';
import { NotAStoredMindmapException } from '../exception/notAStoredMindmap.js';

describe('storableExtension', () => {
    it('keeps the compound mindmap suffix', () => {
        expect(storableExtension('Plan.MINDMAP.json')).toBe('.mindmap.json');
    });

    it('lowercases an allowed extension', () => {
        expect(storableExtension('photo.PNG')).toBe('.png');
    });

    it.each(['icon.svg', 'data.json', 'noextension'])('refuses %s', filename => {
        expect(() => storableExtension(filename)).toThrow(UnsupportedFileTypeException);
    });
});

describe('assertStoredMindmapName', () => {
    it('accepts a server-generated mindmap name', () => {
        expect(() => assertStoredMindmapName('0f8fad5b-d9cb-469f-a165-70867728950e.mindmap.json')).not.toThrow();
    });

    it.each(['../secret.mindmap.json', '0f8fad5b-d9cb-469f-a165-70867728950e.png', 'plan.mindmap.json'])(
        'refuses %s',
        filename => {
            expect(() => assertStoredMindmapName(filename)).toThrow(NotAStoredMindmapException);
        },
    );
});
