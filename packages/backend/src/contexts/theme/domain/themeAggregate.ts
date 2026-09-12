import { ThemeId } from './valueObject/themeId';
import { ThemeName } from './valueObject/themeName';
import { ThemeColors } from './valueObject/themeColors';
import { DefaultThemeMustBeVisibleException } from './exception/defaultThemeMustBeVisible';

/**
 * Un thème du Design Lab : un nom, une palette, et deux drapeaux.
 *
 * `visible` dit si le visiteur du site public peut le choisir. `isDefault` désigne celui que
 * le site sert quand personne n'a choisi — il ne peut donc pas être invisible, sans quoi le
 * site public se retrouverait sans thème du tout. Rien ne l'empêchait jusqu'ici.
 *
 * L'unicité du thème par défaut est tenue par une contrainte en base ; la règle ci-dessous
 * est ce qui empêche d'y arriver dans un état incohérent.
 */
export class Theme {
    private constructor(
        private readonly id: ThemeId,
        private name: ThemeName,
        private colors: ThemeColors,
        private visible: boolean,
        private isDefaultTheme: boolean,
        private readonly createdAt: Date,
    ) {}

    /**
     * Le tout premier thème devient le thème par défaut : sans lui, le site public n'aurait
     * rien à servir. C'est le comportement qu'avait déjà le catalogue sur fichier.
     */
    static create(
        id: ThemeId,
        name: ThemeName,
        colors: ThemeColors,
        visible: boolean,
        isFirstOne: boolean,
        createdAt: Date = new Date(),
    ): Theme {
        // Un premier thème caché reste le défaut : il doit alors être visible, sinon le site
        // public démarrerait sans palette.
        const becomesDefault = isFirstOne;
        return new Theme(id, name, colors, becomesDefault ? true : visible, becomesDefault, createdAt);
    }

    static rehydrate(
        id: ThemeId,
        name: ThemeName,
        colors: ThemeColors,
        visible: boolean,
        isDefault: boolean,
        createdAt: Date,
    ): Theme {
        return new Theme(id, name, colors, visible, isDefault, createdAt);
    }

    getId(): ThemeId {
        return this.id;
    }

    getName(): ThemeName {
        return this.name;
    }

    getColors(): ThemeColors {
        return this.colors;
    }

    isVisible(): boolean {
        return this.visible;
    }

    isDefault(): boolean {
        return this.isDefaultTheme;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    /** Le Design Lab enregistre le thème entier à chaque édition : nom, palette et visibilité. */
    update(name: ThemeName, colors: ThemeColors, visible: boolean): void {
        if (this.isDefaultTheme && !visible) throw new DefaultThemeMustBeVisibleException();
        this.name = name;
        this.colors = colors;
        this.visible = visible;
    }

    /** Devenir le thème par défaut impose d'être visible — on ne sert pas ce qu'on cache. */
    markAsDefault(): void {
        if (!this.visible) throw new DefaultThemeMustBeVisibleException();
        this.isDefaultTheme = true;
    }

    /** Cède la place : appelé sur les autres thèmes quand l'un d'eux devient le défaut. */
    unmarkAsDefault(): void {
        this.isDefaultTheme = false;
    }
}
