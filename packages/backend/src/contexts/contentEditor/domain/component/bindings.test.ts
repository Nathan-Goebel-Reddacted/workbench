import { describe, expect, it } from 'vitest';
import { bindingsIn } from './bindings.js';

const ID = '11111111-1111-4111-8111-111111111111';

describe('insertions liées d’un Text', () => {
    it('lit l’entité et l’id de chaque insertion, quel que soit l’ordre des attributs', () => {
        const html =
            `<p>Projet <span data-id="${ID}" class="data-binding" data-binding="" data-entity="project" ` +
            `data-field="name">x</span> et <span data-binding data-entity='ticket' data-id='t1'></span></p>`;

        expect(bindingsIn(html)).toEqual([
            { entity: 'project', id: ID },
            { entity: 'ticket', id: 't1' },
        ]);
    });

    it('ignore un span sans data-binding, une entité inconnue ou un id absent', () => {
        const html =
            `<span data-entity="project" data-id="${ID}"></span>` +
            `<span data-binding data-entity="idea" data-id="${ID}"></span>` +
            `<span data-binding data-entity="feature"></span>` +
            `<span data-bindings data-entity="feature" data-id="${ID}"></span>`;

        expect(bindingsIn(html)).toEqual([]);
    });
});
