import { InvalidThemeColorsException } from '../exception/invalidThemeColors';

export type ColorMap = Readonly<Record<string, string>>;

/**
 * La palette d'un thème : un jeu de variables CSS et leurs valeurs.
 *
 * Les noms de variables ne sont pas fermés — le Design Lab en ajoute au fil des besoins, et
 * figer la liste ici obligerait à redéployer pour chaque nouvelle. Ce qui est vérifié, c'est
 * qu'une palette dise quelque chose : une palette vide produirait un site sans couleurs.
 */
export class ThemeColors {
    private readonly value: ColorMap;

    constructor(value: ColorMap) {
        const entries = Object.entries(value ?? {});
        if (entries.length === 0) throw new InvalidThemeColorsException('a palette cannot be empty');

        for (const [key, color] of entries) {
            if (key.trim() === '') throw new InvalidThemeColorsException('a variable name cannot be empty');
            if (typeof color !== 'string' || color.trim() === '') {
                throw new InvalidThemeColorsException(`"${key}" has no value`);
            }
        }

        this.value = Object.freeze({ ...value });
    }

    toRecord(): ColorMap {
        return this.value;
    }
}
