import { describe, expect, it } from 'vitest';
import { destinationOf } from './projectDestination.js';
import { ProjectFactory } from '../../domain/factory/projectFactory.js';
import { MultipleReplacingLinksException } from '../../domain/exception/multipleReplacingLinks.js';
import { UnknownProjectLinkException } from '../../domain/exception/unknownProjectLink.js';
import { Link } from '../../domain/valueObject/link.js';
import type { IProjectPageGateway } from '../../domain/port/iProjectPageGateway.js';
import type { Project } from '../../domain/projectAggregate.js';

type LinkInput = { url: string; displayText: string; logo: string; replacesPage?: boolean };

function project(links: LinkInput[] = []): Project {
    return new ProjectFactory().create('p1', 4, 'Logitio', 'Logiciel RH', links, [], true);
}

function pages(hasSections: boolean): IProjectPageGateway {
    return { hasSections: async () => hasSections };
}

const showcase = { url: 'https://logitio.com', displayText: 'Site vitrine', logo: '' };

describe('destination d’un projet', () => {
    it('renvoie vers la page quand elle porte des sections', async () => {
        expect(await destinationOf(project(), pages(true))).toEqual({ kind: 'page' });
    });

    it('n’offre aucune destination quand la page est vide', async () => {
        expect(await destinationOf(project(), pages(false))).toEqual({ kind: 'none' });
    });

    it('renvoie vers le lien marqué quand la page est vide', async () => {
        const destination = await destinationOf(project([{ ...showcase, replacesPage: true }]), pages(false));

        expect(destination).toEqual({ kind: 'external', url: 'https://logitio.com' });
    });

    it('fait primer le lien marqué sur une page remplie', async () => {
        const destination = await destinationOf(project([{ ...showcase, replacesPage: true }]), pages(true));

        expect(destination).toEqual({ kind: 'external', url: 'https://logitio.com' });
    });

    it('ignore les liens non marqués', async () => {
        expect(await destinationOf(project([showcase]), pages(true))).toEqual({ kind: 'page' });
    });
});

describe('invariant du lien de remplacement', () => {
    it('n’accepte qu’un seul lien marqué', () => {
        const held = project([{ ...showcase, replacesPage: true }]);

        expect(() => held.addLink(new Link('https://autre.tld', 'Autre', '', true))).toThrow(
            MultipleReplacingLinksException,
        );
    });

    it('accepte un lien ordinaire de plus', () => {
        const held = project([{ ...showcase, replacesPage: true }]);

        held.addLink(new Link('https://autre.tld', 'Autre', ''));

        expect(held.getReplacingLink()?.getUrl()).toBe('https://logitio.com');
    });

    it('déplace le marqueur sur le lien désigné', () => {
        const held = project([showcase, { url: 'https://autre.tld', displayText: 'Autre', logo: '' }]);

        held.replacePageWith('https://autre.tld');

        expect(held.getReplacingLink()?.getUrl()).toBe('https://autre.tld');
        expect(held.getLinks().filter(l => l.isReplacingPage())).toHaveLength(1);
    });

    it('refuse de marquer une URL que le projet ne porte pas', () => {
        const held = project([showcase]);

        expect(() => held.replacePageWith('https://inconnu.tld')).toThrow(UnknownProjectLinkException);
    });

    it('rend sa page au projet', () => {
        const held = project([{ ...showcase, replacesPage: true }]);

        held.keepOwnPage();

        expect(held.getReplacingLink()).toBeNull();
    });
});
