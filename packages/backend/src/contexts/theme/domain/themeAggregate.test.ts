import { describe, expect, it } from 'vitest';
import { Theme } from './themeAggregate.js';
import { ThemeId } from './valueObject/themeId.js';
import { ThemeName } from './valueObject/themeName.js';
import { ThemeColors } from './valueObject/themeColors.js';
import { InvalidThemeNameException } from './exception/invalidThemeName.js';
import { InvalidThemeColorsException } from './exception/invalidThemeColors.js';
import { DefaultThemeMustBeVisibleException } from './exception/defaultThemeMustBeVisible.js';

const palette = () => new ThemeColors({ '--color-bg': '#fff', '--color-text': '#000' });
const name = (value = 'sable') => new ThemeName(value);

function theme(options: { visible?: boolean; first?: boolean } = {}) {
    return Theme.create(new ThemeId(), name(), palette(), options.visible ?? true, options.first ?? false);
}

describe('ThemeName', () => {
    it('refuse un nom vide ou trop long', () => {
        expect(() => new ThemeName('   ')).toThrow(InvalidThemeNameException);
        expect(() => new ThemeName('x'.repeat(61))).toThrow(InvalidThemeNameException);
    });

    it('accepte 60 caractères et rogne les espaces', () => {
        expect(new ThemeName('  sable  ').getValue()).toBe('sable');
        expect(new ThemeName('x'.repeat(60)).getValue()).toHaveLength(60);
    });
});

describe('ThemeColors', () => {
    it('refuse une palette vide — un site sans couleurs n’est pas un thème', () => {
        expect(() => new ThemeColors({})).toThrow(InvalidThemeColorsException);
    });

    it('refuse une variable sans valeur', () => {
        expect(() => new ThemeColors({ '--color-bg': '  ' })).toThrow(InvalidThemeColorsException);
    });

    it('n’enferme pas la liste des variables : le Design Lab en ajoute au fil des besoins', () => {
        const colors = new ThemeColors({ '--une-variable-inventee-demain': '#123456' });
        expect(colors.toRecord()).toEqual({ '--une-variable-inventee-demain': '#123456' });
    });
});

describe('Theme', () => {
    it('fait du tout premier thème le thème par défaut', () => {
        const first = theme({ first: true });

        expect(first.isDefault()).toBe(true);
        expect(first.isVisible()).toBe(true);
    });

    it('rend visible le premier thème même s’il est créé masqué', () => {
        // Sinon le site public démarrerait sur un défaut qu'il n'a pas le droit de servir.
        const first = Theme.create(new ThemeId(), name(), palette(), false, true);

        expect(first.isVisible()).toBe(true);
    });

    it('ne fait pas du deuxième thème un défaut', () => {
        expect(theme({ first: false }).isDefault()).toBe(false);
    });

    it('refuse de masquer le thème par défaut', () => {
        const current = theme({ first: true });

        expect(() => current.update(name('sable'), palette(), false)).toThrow(DefaultThemeMustBeVisibleException);
        expect(current.isVisible()).toBe(true);
    });

    it('laisse masquer un thème ordinaire', () => {
        const other = theme();

        other.update(name('forêt'), palette(), false);

        expect(other.isVisible()).toBe(false);
    });

    it('refuse de désigner un thème masqué comme défaut', () => {
        const hidden = theme({ visible: false });

        expect(() => hidden.markAsDefault()).toThrow(DefaultThemeMustBeVisibleException);
        expect(hidden.isDefault()).toBe(false);
    });

    it('passe le drapeau d’un thème à l’autre', () => {
        const previous = theme({ first: true });
        const next = theme();

        previous.unmarkAsDefault();
        next.markAsDefault();

        expect(previous.isDefault()).toBe(false);
        expect(next.isDefault()).toBe(true);
    });
});
