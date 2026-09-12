import { describe, expect, it } from 'vitest';
import { ConvertIdeaToProjectHandler } from './convertIdeaToProjectHandler.js';
import { ConvertIdeaToProjectCommand } from './convertIdeaToProjectCommand.js';
import { Idea } from '../../../domain/ideaAggregate.js';
import { IdeaId } from '../../../domain/valueObject/ideaId.js';
import { Name } from '../../../domain/valueObject/name.js';
import { Description } from '../../../domain/valueObject/description.js';
import { Category } from '../../../domain/valueObject/category.js';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import { FakeTransactionRunner } from '@shared/application/port/transactionRunnerDouble.js';
import type { IIdeaRepository } from '../../../domain/repository/iIdeaRepository.js';
import type { IIdeaFeaturesGateway } from '../../../domain/port/iIdeaFeaturesGateway.js';
import type { IProjectCreationGateway, ProjectDraft } from '../../../domain/port/iProjectCreationGateway.js';

// La conversion est la règle la plus subtile de l'atelier : le projet créé **reprend le
// numéro de l'idée**. Projets et idées partageant la même séquence, aucune référence de
// ticket n'a besoin d'être réécrite — `4.8.23` reste `4.8.23`. Casser cela romprait
// silencieusement toutes les références déjà citées ailleurs.

const IDEA_NUMBER = 4;

function idea(): Idea {
    return new Idea(
        new IdeaId('i1'),
        IDEA_NUMBER,
        new Name('Mouse Breeder'),
        new Description('Une animalerie de laboratoire'),
        [],
        [],
        new Date('2026-01-01'),
        Category.Personal,
    );
}

type Harness = {
    handler: ConvertIdeaToProjectHandler;
    trace: string[];
    drafts: ProjectDraft[];
    tx: FakeTransactionRunner;
};

function harness(options: { found?: Idea | null } = {}): Harness {
    const trace: string[] = [];
    const drafts: ProjectDraft[] = [];
    const tx = new FakeTransactionRunner();
    const stored = options.found === undefined ? idea() : options.found;

    const repository = {
        findById: async () => stored,
        delete: async () => void trace.push(`delete:idea(tx=${tx.inTransaction})`),
    } as unknown as IIdeaRepository;

    const features: IIdeaFeaturesGateway = {
        countOf: async () => ({ features: 2, tickets: 5 }),
        deleteAllOf: async () => [],
        transferToProject: async () => void trace.push(`transfer:features(tx=${tx.inTransaction})`),
    };

    const projects: IProjectCreationGateway = {
        create: async draft => {
            drafts.push(draft);
            trace.push(`create:project(tx=${tx.inTransaction})`);
        },
    };

    return { handler: new ConvertIdeaToProjectHandler(repository, features, projects, tx), trace, drafts, tx };
}

describe('ConvertIdeaToProjectHandler', () => {
    it('donne au projet le numéro de l’idée — c’est ce qui rend la conversion invisible aux références', async () => {
        const { handler, drafts } = harness();

        await handler.handle(new ConvertIdeaToProjectCommand('i1', 'p1'));

        expect(drafts).toHaveLength(1);
        expect(drafts[0].number).toBe(IDEA_NUMBER);
        expect(drafts[0].id).toBe('p1');
        expect(drafts[0].name).toBe('Mouse Breeder');
    });

    it('transfère les features AVANT de supprimer l’idée', async () => {
        // Inversé, la suppression déclencherait la cascade et emporterait les features
        // qu'on vient de rattacher au projet.
        const { handler, trace } = harness();

        await handler.handle(new ConvertIdeaToProjectCommand('i1', 'p1'));

        expect(trace).toEqual(['create:project(tx=true)', 'transfer:features(tx=true)', 'delete:idea(tx=true)']);
    });

    it('mène les trois écritures dans une seule transaction', async () => {
        const { handler, tx } = harness();

        await handler.handle(new ConvertIdeaToProjectCommand('i1', 'p1'));

        expect(tx.started).toBe(1);
        expect(tx.committed).toBe(1);
    });

    it('reprend la catégorie de l’idée quand aucune n’est imposée', async () => {
        const { handler, drafts } = harness();

        await handler.handle(new ConvertIdeaToProjectCommand('i1', 'p1'));

        expect(drafts[0].category).toBe(Category.Personal);
    });

    it('laisse l’appelant imposer une autre catégorie', async () => {
        const { handler, drafts } = harness();

        await handler.handle(new ConvertIdeaToProjectCommand('i1', 'p1', 'professional'));

        expect(drafts[0].category).toBe('professional');
    });

    it('rend 404 pour une idée inconnue, sans rien écrire', async () => {
        const { handler, trace, tx } = harness({ found: null });

        await expect(handler.handle(new ConvertIdeaToProjectCommand('inconnue', 'p1'))).rejects.toThrow(NotFoundError);

        expect(trace).toEqual([]);
        expect(tx.started).toBe(0);
    });
});
