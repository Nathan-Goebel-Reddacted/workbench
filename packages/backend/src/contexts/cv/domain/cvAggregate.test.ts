import { describe, expect, it } from 'vitest';
import { Cv } from './cvAggregate.js';
import { CvId } from './valueObject/cvId.js';
import { CvName } from './valueObject/cvName.js';
import { CvFileUrl } from './valueObject/cvFileUrl.js';
import { CvMustBePdfException } from './exception/cvMustBePdf.js';

// Un CV est un fichier proposé au téléchargement. Deux règles seulement, mais elles tiennent
// le site public : c'est un PDF, et le visiteur ne voit que ce qui a été publié.

function cv(visible = false, order = 0): Cv {
    return new Cv(new CvId(), new CvName('CV 2026'), new CvFileUrl('/uploads/cv.pdf'), visible, order, new Date());
}

describe('Cv — le fichier', () => {
    it('refuse ce qui n’est pas un PDF', () => {
        expect(() => new CvFileUrl('/uploads/cv.docx')).toThrow(CvMustBePdfException);
    });

    it('refuse une URL vide', () => {
        expect(() => new CvFileUrl('   ')).toThrow(CvMustBePdfException);
    });

    it('accepte un PDF derrière des paramètres d’URL', () => {
        expect(new CvFileUrl('/uploads/mon-cv.pdf?v=3').getValue()).toBe('/uploads/mon-cv.pdf?v=3');
    });

    it('reconnaît l’extension quelle que soit la casse', () => {
        expect(() => new CvFileUrl('/uploads/CV.PDF')).not.toThrow();
    });
});

describe('Cv — exposition et ordre', () => {
    it('se publie et se retire', () => {
        const document = cv();

        document.publish();
        expect(document.isVisible()).toBe(true);

        document.hide();
        expect(document.isVisible()).toBe(false);
    });

    it('change de rang sans toucher au reste', () => {
        const document = cv(true, 0);

        document.moveTo(3);

        expect(document.getDisplayOrder()).toBe(3);
        expect(document.isVisible()).toBe(true);
        expect(document.getFileUrl().getValue()).toBe('/uploads/cv.pdf');
    });
});
