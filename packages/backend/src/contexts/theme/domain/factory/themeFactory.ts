import { Theme } from '../themeAggregate';
import { ThemeId } from '../valueObject/themeId';
import { ThemeName } from '../valueObject/themeName';
import { ColorMap, ThemeColors } from '../valueObject/themeColors';

const VISIBLE_BY_DEFAULT = true;

export class ThemeFactory {
    create(id: string, name: string | null, colors: ColorMap, visible: boolean | null, isFirstOne: boolean): Theme {
        return Theme.create(
            new ThemeId(id),
            name === null ? ThemeName.default() : new ThemeName(name),
            new ThemeColors(colors),
            visible ?? VISIBLE_BY_DEFAULT,
            isFirstOne,
        );
    }
}
