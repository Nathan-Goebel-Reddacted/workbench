import { describe, expect, it } from 'vitest';
import { parseColor, safeCssColor } from './color.js';

describe('parseColor', () => {
    it.each([
        [{ theme: '--color-primary' }, { theme: '--color-primary' }],
        [{ theme: '--color-mindmap-red-soft' }, { theme: '--color-mindmap-red-soft' }],
        [{ hex: '#ABC' }, { hex: '#abc' }],
        [{ hex: '#a1b2c3' }, { hex: '#a1b2c3' }],
        [{ hex: '#a1b2c3d4' }, { hex: '#a1b2c3d4' }],
    ])('accepte %j', (raw, expected) => {
        expect(parseColor(raw)).toEqual(expected);
    });

    it.each([
        [{ theme: 'primary' }],
        [{ theme: '--color-primary; background: red' }],
        [{ theme: '--color-x) url(javascript:1' }],
        [{ hex: 'red' }],
        [{ hex: '#abcd' }],
        [{ hex: '#fff;' }],
        [{ hex: 'url(https://evil.test/x.png)' }],
        [{ hex: 'rgb(0, 0, 0)' }],
        [{ hex: '#fff', theme: '--color-text' }],
        ['#fff'],
        [null],
        [[]],
    ])('refuse %j', raw => {
        expect(parseColor(raw)).toBeNull();
    });
});

describe('safeCssColor', () => {
    it.each([
        ['#FFF', '#fff'],
        ['var(--color-primary)', 'var(--color-primary)'],
        ['inherit', 'inherit'],
        ['rgb(255, 0, 16)', '#ff0010'],
        ['rgba(0, 0, 0, 0.5)', '#00000080'],
        ['rgba(0, 0, 0, 1)', '#000000'],
    ])('garde %s sous la forme %s', (css, expected) => {
        expect(safeCssColor(css)).toBe(expected);
    });

    it.each([
        'red',
        'url(https://evil.test/x.png)',
        '#fff; background: url(x)',
        'var(--color-primary, url(x))',
        'expression(alert(1))',
        'rgb(300, 0, 0)',
        'rgba(0, 0, 0, 2)',
    ])('refuse %s', css => {
        expect(safeCssColor(css)).toBeNull();
    });
});
