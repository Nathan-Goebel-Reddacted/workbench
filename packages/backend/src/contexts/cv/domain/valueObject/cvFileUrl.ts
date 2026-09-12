import { CvMustBePdfException } from '../exception/cvMustBePdf';

/**
 * Le fichier d'un CV. La règle est la même depuis toujours — c'est un PDF — mais elle vivait
 * dans une fonction libre au bas de l'agrégat, hors de portée de tout autre appelant.
 *
 * La vérification porte sur le chemin seul : une URL signée trimballe des paramètres après le
 * `?`, et `mon-cv.pdf?v=3` reste un PDF.
 */
export class CvFileUrl {
    private readonly value: string;

    constructor(value: string) {
        const trimmed = (value ?? '').trim();
        if (trimmed === '' || !isPdf(trimmed)) throw new CvMustBePdfException();
        this.value = trimmed;
    }

    getValue(): string {
        return this.value;
    }
}

function isPdf(url: string): boolean {
    return url.split('?')[0].toLowerCase().endsWith('.pdf');
}
