import { describe, expect, it } from 'vitest';
import { PageLayout } from './pageLayoutAggregate.js';
import { PageLayoutId } from './valueObject/pageLayoutId.js';
import { PageType } from './valueObject/pageType.js';
import { PageRef } from './valueObject/pageRef.js';
import { Section } from './entity/section.js';
import { SectionId } from './valueObject/sectionId.js';
import { SectionType } from './valueObject/sectionType.js';
import { SectionContent } from './valueObject/sectionContent/sectionContent.js';
import { GRID_COLUMNS, GridPosition } from './valueObject/gridPosition.js';
import { InvalidGridPositionException } from './exception/invalidGridPosition.js';
import { SectionTypeNotAllowedException } from './exception/sectionTypeNotAllowed.js';

// Un PageLayout est la grille d'une page : des sections posées en x/y/w/h. Ce qui compte ici
// est qu'une section se retrouve par son identité — la grille se manipule à distance, depuis
// l'éditeur, et une commande qui vise une section disparue ne doit pas en déplacer une autre.

function section(id: SectionId, position = new GridPosition(0, 0, 2, 2)): Section {
    return new Section(id, SectionType.TEXT, SectionContent.initial(SectionType.TEXT), position);
}

function layout(sections: Section[] = []): PageLayout {
    return new PageLayout(new PageLayoutId(), PageType.PORTFOLIO, new PageRef(), sections);
}

describe('GridPosition', () => {
    it('refuse une position hors grille ou une taille nulle', () => {
        expect(() => new GridPosition(-1, 0, 1, 1)).toThrow(InvalidGridPositionException);
        expect(() => new GridPosition(0, 0, 0, 1)).toThrow(InvalidGridPositionException);
        expect(() => new GridPosition(0, 0, 1, 0)).toThrow(InvalidGridPositionException);
    });

    it('refuse une section qui dépasse la dernière colonne', () => {
        expect(() => new GridPosition(GRID_COLUMNS - 2, 0, 3, 1)).toThrow(InvalidGridPositionException);
        expect(() => new GridPosition(GRID_COLUMNS, 0, 1, 1)).toThrow(InvalidGridPositionException);
        expect(() => new GridPosition(GRID_COLUMNS - 3, 0, 3, 1)).not.toThrow();
    });

    it('se compare sur ses quatre composantes', () => {
        expect(new GridPosition(1, 2, 3, 4).equals(new GridPosition(1, 2, 3, 4))).toBe(true);
        expect(new GridPosition(1, 2, 3, 4).equals(new GridPosition(1, 2, 3, 5))).toBe(false);
    });
});

describe('PageLayout — sections', () => {
    it('ajoute une section à la grille', () => {
        const page = layout();

        page.addSection(section(new SectionId()));

        expect(page.getSections()).toHaveLength(1);
    });

    it('place une nouvelle section sous la plus basse, avec la taille par défaut', () => {
        const page = layout([
            section(new SectionId(), new GridPosition(0, 0, 2, 2)),
            section(new SectionId(), new GridPosition(3, 1, 2, 5)),
        ]);

        expect(page.nextFreePosition().equals(new GridPosition(0, 6, 4, 3))).toBe(true);
    });

    it('place la première section en haut de la grille', () => {
        expect(
            layout()
                .nextFreePosition()
                .equals(new GridPosition(0, 0, 4, 3)),
        ).toBe(true);
    });

    it('retire la section visée, et elle seule', () => {
        const cible = new SectionId();
        const page = layout([section(cible), section(new SectionId())]);

        page.removeSection(cible);

        expect(page.getSections()).toHaveLength(1);
        expect(page.getSections()[0].getId().equals(cible)).toBe(false);
    });

    it('déplace la section visée', () => {
        const cible = new SectionId();
        const page = layout([section(cible)]);

        page.moveSection(cible, new GridPosition(4, 5, 2, 3));

        expect(
            page
                .getSections()[0]
                .getPosition()
                .equals(new GridPosition(4, 5, 2, 3)),
        ).toBe(true);
    });

    it('ne touche à rien quand la section visée n’existe plus', () => {
        const page = layout([section(new SectionId(), new GridPosition(0, 0, 1, 1))]);

        page.moveSection(new SectionId(), new GridPosition(9, 9, 1, 1));

        expect(
            page
                .getSections()[0]
                .getPosition()
                .equals(new GridPosition(0, 0, 1, 1)),
        ).toBe(true);
    });

    it('remplace le contenu d’une section', () => {
        const cible = new SectionId();
        const page = layout([
            new Section(
                cible,
                SectionType.LINK,
                SectionContent.initial(SectionType.LINK),
                new GridPosition(0, 0, 2, 2),
            ),
        ]);

        page.updateSectionContent(cible, { externalLinks: [] });

        expect(page.getSections()[0].getContent().toRecord()).toEqual({ externalLinks: [] });
    });

    it('refuse une carte projet sur le portfolio', () => {
        const page = layout();
        const card = new Section(
            new SectionId(),
            SectionType.PROJECT_CARD,
            SectionContent.initial(SectionType.PROJECT_CARD),
            new GridPosition(0, 0, 2, 2),
        );

        expect(() => page.addSection(card)).toThrow(SectionTypeNotAllowedException);
        expect(page.getSections()).toHaveLength(0);
    });

    it('accepte une carte projet sur une page projet', () => {
        const page = new PageLayout(new PageLayoutId(), PageType.PROJECT, new PageRef());
        const card = new Section(
            new SectionId(),
            SectionType.PROJECT_CARD,
            SectionContent.initial(SectionType.PROJECT_CARD),
            new GridPosition(0, 0, 2, 2),
        );

        page.addSection(card);

        expect(page.getSections()).toHaveLength(1);
    });

    it('rend une copie : modifier la liste rendue ne pose rien sur la grille', () => {
        const page = layout();

        page.getSections().push(section(new SectionId()));

        expect(page.getSections()).toHaveLength(0);
    });
});
