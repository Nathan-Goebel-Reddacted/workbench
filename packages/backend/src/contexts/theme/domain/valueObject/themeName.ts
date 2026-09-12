import { InvalidThemeNameException, THEME_NAME_MAX_LENGTH } from '../exception/invalidThemeName';

export class ThemeName {
    private readonly value: string;

    constructor(value: string) {
        const trimmed = (value ?? '').trim();
        if (trimmed === '' || trimmed.length > THEME_NAME_MAX_LENGTH) throw new InvalidThemeNameException();
        this.value = trimmed;
    }

    getValue(): string {
        return this.value;
    }
}
