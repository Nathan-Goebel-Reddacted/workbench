export enum LanguageEnum {
    JAVASCRIPT = 'javascript',
    PYTHON = 'python',
    JAVA = 'java',
    C = 'c',
    CPP = 'cpp',
    CSHARP = 'csharp',
    PHP = 'php',
    GO = 'go',
    RUST = 'rust',
    TYPESCRIPT = 'typescript',
    SWIFT = 'swift',
    KOTLIN = 'kotlin',
    RUBY = 'ruby',
    SCALA = 'scala',
    PERL = 'perl',
    DART = 'dart',
    HASKELL = 'haskell',
    ELIXIR = 'elixir',
    ERLANG = 'erlang',
    LISP = 'lisp',
    PROLOG = 'prolog',
    FSHARP = 'fsharp',
    OCAML = 'ocaml',
    SQL = 'sql',
    HTML = 'html',
    CSS = 'css',
    OTHER = 'other',
}

export class Language {
    private readonly value: LanguageEnum;

    constructor(value: LanguageEnum) {
        this.value = value;
    }

    getValue() {
        return this.value;
    }
}
