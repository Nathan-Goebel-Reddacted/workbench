import { describe, expect, it } from 'vitest';
import { parseLinkUrl, parseSafeUrl } from './safeUrl.js';

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

    it.each(['/', '/projects', '/cv'])('refuse la page du site %s, réservée au Link', raw => {
        expect(parseSafeUrl(raw)).toBeNull();
    });
});

describe('parseLinkUrl', () => {
    it.each([
        ['/', '/'],
        [' /projects ', '/projects'],
        ['/cv', '/cv'],
        ['/uploads/a-1.png', '/uploads/a-1.png'],
        ['https://example.com', 'https://example.com/'],
    ])('accepte %s', (raw, expected) => {
        expect(parseLinkUrl(raw)).toBe(expected);
    });

    it.each(['/admin', '/projects/', '/projects/x', '/cv/../admin', '/CV', 'javascript:alert(1)', '//evil.test'])(
        'refuse %s',
        raw => {
            expect(parseLinkUrl(raw)).toBeNull();
        },
    );
});
