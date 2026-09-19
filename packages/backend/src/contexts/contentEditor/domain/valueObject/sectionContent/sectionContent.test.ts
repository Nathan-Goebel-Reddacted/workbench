import { describe, expect, it } from 'vitest';
import { SectionContent } from './sectionContent.js';
import { SectionType } from '../sectionType.js';
import { InvalidSectionContentException } from '../../exception/invalidSectionContent.js';

describe('SectionContent — écriture', () => {
    it('complète les clés absentes avec les valeurs par défaut du type', () => {
        expect(SectionContent.fromInput(SectionType.DOCUMENT, { url: '/uploads/a.png' }).toRecord()).toEqual({
            url: '/uploads/a.png',
            alt: '',
            fit: 'contain',
            position: 'center',
            radius: 4,
        });
    });

    it('écarte les clés que le type ne connaît pas', () => {
        expect(SectionContent.fromInput(SectionType.CODE, { code: 'x', stray: 1 }).toRecord()).toEqual({
            code: 'x',
            language: '',
            wrap: false,
        });
    });

    it('refuse une valeur hors vocabulaire', () => {
        expect(() => SectionContent.fromInput(SectionType.DOCUMENT, { fit: 'stretch' })).toThrow(
            InvalidSectionContentException,
        );
    });

    it('refuse un rayon hors bornes', () => {
        expect(() => SectionContent.fromInput(SectionType.BACKGROUND, { radius: 200 })).toThrow(
            InvalidSectionContentException,
        );
    });

    it('refuse un type de valeur inattendu', () => {
        expect(() => SectionContent.fromInput(SectionType.LINK_AREA, { newTab: 'yes' })).toThrow(
            InvalidSectionContentException,
        );
    });

    it('refuse un embed qui ne pointe pas vers une URL http(s)', () => {
        expect(() => SectionContent.fromInput(SectionType.EMBED, { url: 'javascript:alert(1)' })).toThrow(
            InvalidSectionContentException,
        );
        expect(SectionContent.fromInput(SectionType.EMBED, { url: 'https://example.com' }).toRecord().url).toBe(
            'https://example.com',
        );
    });

    it('donne un identifiant aux champs de formulaire qui n’en ont pas', () => {
        const { fields } = SectionContent.fromInput(SectionType.CONTACT_FORM, {
            fields: [{ id: 'kept', label: 'Nom' }, { label: 'Société' }],
        }).toRecord() as { fields: { id: string }[] };

        expect(fields[0].id).toBe('kept');
        expect(fields[1].id).not.toBe('');
    });

    it('conserve le HTML du texte', () => {
        expect(SectionContent.fromInput(SectionType.TEXT, { html: '<p>a</p>' }).toRecord()).toEqual({
            html: '<p>a</p>',
        });
    });
});

describe('SectionContent — contenu initial', () => {
    it('pose le trio Nom / Email / Message sur un formulaire neuf', () => {
        const content = SectionContent.initial(SectionType.CONTACT_FORM).toRecord() as {
            fields: { id: string }[];
            submitLabel: string;
        };

        expect(content.fields.map(f => f.id)).toEqual(['name', 'email', 'message']);
        expect(content.submitLabel).toBe('Envoyer');
    });

    it('rend un contenu complet pour chaque type', () => {
        for (const type of Object.values(SectionType)) {
            expect(() => SectionContent.initial(type)).not.toThrow();
        }
    });
});

describe('SectionContent — relecture', () => {
    it('ne lève jamais sur un contenu ancien ou abîmé', () => {
        expect(
            SectionContent.rehydrate(SectionType.DOCUMENT, { fit: 'stretch', radius: '200' }).toRecord(),
        ).toMatchObject({ fit: 'contain', radius: 64 });
    });

    it('reprend l’ancien texte libre', () => {
        expect(SectionContent.rehydrate(SectionType.TEXT, { text: 'bonjour' }).toRecord()).toEqual({
            html: 'bonjour',
        });
    });

    it('vide une URL d’embed dangereuse au lieu de la servir', () => {
        expect(SectionContent.rehydrate(SectionType.EMBED, { url: 'javascript:alert(1)' }).toRecord().url).toBe('');
    });
});
