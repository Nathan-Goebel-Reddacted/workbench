import { describe, expect, it } from 'vitest';
import { sanitizeInlineColors } from './inlineColors.js';

describe('sanitizeInlineColors', () => {
    it('garde les couleurs conformes et les autres déclarations', () => {
        const html = '<p><span style="font-size: 20px; color: rgb(255, 0, 0)">a</span></p>';

        expect(sanitizeInlineColors(html)).toBe('<p><span style="font-size: 20px;color: #ff0000">a</span></p>');
    });

    it('retire une couleur hors règle sans toucher au reste', () => {
        const html = `<mark data-color="url(x)" style="background-color: url(x); color: inherit">a</mark>`;

        expect(sanitizeInlineColors(html)).toBe('<mark style="color: inherit">a</mark>');
    });

    it('garde un surlignage du thème', () => {
        const html = '<mark data-color="var(--color-primary)" style="background-color: var(--color-primary)">a</mark>';

        expect(sanitizeInlineColors(html)).toBe(
            '<mark data-color="var(--color-primary)" style="background-color: var(--color-primary)">a</mark>',
        );
    });

    it('n’est pas trompé par un chevron dans un autre attribut', () => {
        const html = `<span title=">" style="color: expression(alert(1))">a</span>`;

        expect(sanitizeInlineColors(html)).toBe('<span title=">" style="">a</span>');
    });

    it('ne touche pas au texte hors des balises', () => {
        const html = '<p>style="color: url(x)"</p>';

        expect(sanitizeInlineColors(html)).toBe(html);
    });
});
