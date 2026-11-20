import { describe, expect, it } from 'vitest';
import { StoreUploadHandler } from './storeUploadHandler.js';
import { StoreUploadCommand } from './storeUploadCommand.js';
import { UnsupportedFileTypeException } from '@shared/domain/exception/unsupportedFileType.js';
import type { IFileStorage } from '@shared/application/port/iFileStorage.js';

function storage(saved: string[]): IFileStorage {
    return {
        save: async extension => {
            saved.push(extension);
            return `/uploads/new${extension}`;
        },
        rewrite: async () => true,
        read: async () => null,
    };
}

describe('StoreUploadHandler', () => {
    it('saves the file under its storable extension and returns its url', async () => {
        const saved: string[] = [];
        const url = await new StoreUploadHandler(storage(saved)).handle(
            new StoreUploadCommand('Cover.JPG', Buffer.from('x')),
        );
        expect(saved).toEqual(['.jpg']);
        expect(url).toBe('/uploads/new.jpg');
    });

    it('refuses a type the site cannot serve safely, without writing anything', async () => {
        const saved: string[] = [];
        await expect(
            new StoreUploadHandler(storage(saved)).handle(new StoreUploadCommand('x.svg', Buffer.from('x'))),
        ).rejects.toThrow(UnsupportedFileTypeException);
        expect(saved).toEqual([]);
    });
});
