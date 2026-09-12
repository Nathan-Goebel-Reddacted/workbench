import { describe, expect, it } from 'vitest';
import { Project } from './projectAggregate.js';
import { ProjectId } from './valueObject/projectId.js';
import { Name } from './valueObject/name.js';
import { Description } from './valueObject/description.js';
import { Category } from './valueObject/category.js';
import { Link } from './valueObject/link.js';
import { InvalidLinkUrlException } from './exception/invalidLinkUrl.js';
import { InvalidLogoException } from './exception/invalidLogo.js';
import { Document } from '@shared/domain/entity/document.js';
import { DocumentId } from '@shared/domain/valueObject/documentId.js';
import { DocumentType } from '@shared/domain/valueObject/documentType.js';

// Un Project est ce que le site public montre. Deux choses s'y jouent : ce qu'il expose
// (visible ou non — un projet en cours ne doit pas fuiter) et ce qu'il agrège (documents et
// liens, dont l'identité fait l'unicité).

function project(visible = false): Project {
    return new Project(
        new ProjectId(),
        1,
        new Name('Atelier'),
        new Description('un portfolio'),
        [],
        [],
        visible,
        Category.Personal,
    );
}

function document(id: string, name = 'schema'): Document {
    return new Document(new DocumentId(id), name, '/uploads/schema.png', DocumentType.IMAGE);
}

describe('Project — exposition publique', () => {
    it('naît caché : la publication est une décision, jamais un défaut', () => {
        expect(project().isVisible()).toBe(false);
    });

    it('se publie puis se retire sans rien perdre', () => {
        const p = project();

        p.publish();
        expect(p.isVisible()).toBe(true);

        p.hide();
        expect(p.isVisible()).toBe(false);
        expect(p.getName().getValue()).toBe('Atelier');
    });
});

describe('Project — documents', () => {
    it('ignore un document déjà attaché plutôt que de le dupliquer', () => {
        const p = project();
        const doc = document('11111111-1111-4111-8111-111111111111');

        p.addDocument(doc);
        p.addDocument(document('11111111-1111-4111-8111-111111111111', 'autre nom'));

        expect(p.getDocuments()).toHaveLength(1);
    });

    it('retire un document par son identité', () => {
        const p = project();
        p.addDocument(document('11111111-1111-4111-8111-111111111111'));
        p.addDocument(document('22222222-2222-4222-8222-222222222222'));

        p.removeDocument(new DocumentId('11111111-1111-4111-8111-111111111111'));

        expect(p.getDocuments().map(d => d.getId().getValue())).toEqual(['22222222-2222-4222-8222-222222222222']);
    });

    it('rend une copie : modifier la liste rendue n’attache rien', () => {
        const p = project();

        p.getDocuments().push(document('33333333-3333-4333-8333-333333333333'));

        expect(p.getDocuments()).toHaveLength(0);
    });
});

describe('Project — liens', () => {
    it('refuse une URL qui n’en est pas une', () => {
        expect(() => new Link('pas-une-url', 'ici')).toThrow(InvalidLinkUrlException);
    });

    it('refuse un logo dont l’extension n’est pas une image', () => {
        expect(() => new Link('https://exemple.test', 'ici', 'logo.exe')).toThrow(InvalidLogoException);
    });

    it('accepte un logo embarqué en data URI', () => {
        expect(() => new Link('https://exemple.test', 'ici', 'data:image/png;base64,AAAA')).not.toThrow();
    });

    it('retire un lien par son URL', () => {
        const p = project();
        p.addLink(new Link('https://un.test', 'un'));
        p.addLink(new Link('https://deux.test', 'deux'));

        p.removeLink(new Link('https://un.test', 'peu importe le libellé'));

        expect(p.getLinks().map(l => l.getUrl())).toEqual(['https://deux.test']);
    });
});

describe('Project — nom', () => {
    it('refuse un nom vide', () => {
        expect(() => new Name('   ')).toThrow();
    });

    it('refuse un nom au-delà de 255 caractères', () => {
        expect(() => new Name('a'.repeat(256))).toThrow();
    });

    it('se renomme et se reclasse', () => {
        const p = project();

        p.rename(new Name('Workbench'));
        p.reclassify(Category.Professional);

        expect(p.getName().getValue()).toBe('Workbench');
        expect(p.getCategory()).toBe(Category.Professional);
    });
});
