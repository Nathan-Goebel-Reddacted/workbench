import { describe, expect, it } from 'vitest';
import { ThemeFactory } from './themeFactory.js';
import { ThemeName } from '../valueObject/themeName.js';

const colors = { '--color-bg': '#fff', '--color-text': '#000' };

describe('ThemeFactory', () => {
    it('nomme et rend visible un thème créé sans précision', () => {
        const theme = new ThemeFactory().create('3f1c1a44-2b6e-4c8e-9a51-0d4b7e2f6a10', null, colors, null, false);

        expect(theme.getName().getValue()).toBe(ThemeName.DEFAULT);
        expect(theme.isVisible()).toBe(true);
    });

    it('garde le nom et la visibilité fournis', () => {
        const theme = new ThemeFactory().create('3f1c1a44-2b6e-4c8e-9a51-0d4b7e2f6a10', 'sable', colors, false, false);

        expect(theme.getName().getValue()).toBe('sable');
        expect(theme.isVisible()).toBe(false);
    });
});
