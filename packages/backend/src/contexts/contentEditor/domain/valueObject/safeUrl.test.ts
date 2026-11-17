import { describe, expect, it } from 'vitest';
import { parseSafeUrl } from './safeUrl.js';

describe('parseSafeUrl', () => {
    it.each([
        ['https://example.com', 'https://example.com/'],
        ['  http://example.com/a?b=c#d  ', 'http://example.com/a?b=c#d'],
        ['HTTPS://Example.com/x', 'https://example.com/x'],
        ['/uploads/a-1.png', '/uploads/a-1.png'],
        ['/projects/11111111-1111-4111-8111-111111111111', '/projects/11111111-1111-4111-8111-111111111111'],
    ])('accepte %s', (raw, expected) => {
        expect(parseSafeUrl(raw)).toBe(expected);
    });

    it.each([
        'javascript:alert(1)',
        '  JavaScript:alert(1)',
        '\tjavascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'DATA:text/html,x',
        'vbscript:msgbox(1)',
        '//evil.test/x',
        '/uploads/../secret',
        '/uploads/',
        '/projects/not-an-id',
        '/admin',
        'ftp://example.com',
        'https://',
        'example.com',
        '',
    ])('refuse %s', raw => {
        expect(parseSafeUrl(raw)).toBeNull();
    });
});
