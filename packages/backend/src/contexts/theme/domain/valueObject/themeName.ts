import { InvalidThemeNameException, THEME_NAME_MAX_LENGTH } from '../exception/invalidThemeName';

export class ThemeName {
    static readonly DEFAULT = 'New theme';

    private readonly value: string;

    static default(): ThemeName {
        return new ThemeName(ThemeName.DEFAULT);
    }

    constructor(value: string) {
        const trimmed = (value ?? '').trim();
        if (trimmed === '' || trimmed.length > THEME_NAME_MAX_LENGTH) throw new InvalidThemeNameException();
        this.value = trimmed;
    }

    getValue(): string {
        return this.value;
    }
}
