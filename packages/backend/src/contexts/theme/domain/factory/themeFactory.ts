import { Theme } from '../themeAggregate';
import { ThemeId } from '../valueObject/themeId';
import { ThemeName } from '../valueObject/themeName';
import { ColorMap, ThemeColors } from '../valueObject/themeColors';

export class ThemeFactory {
    create(id: string, name: string, colors: ColorMap, visible: boolean, isFirstOne: boolean): Theme {
        return Theme.create(new ThemeId(id), new ThemeName(name), new ThemeColors(colors), visible, isFirstOne);
    }
}
