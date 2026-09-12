import { describe, expect, it } from 'vitest';
import { SetDefaultThemeHandler } from './setDefaultThemeHandler.js';
import { SetDefaultThemeCommand } from './setDefaultThemeCommand.js';
import { Theme } from '../../../domain/themeAggregate.js';
import { ThemeId } from '../../../domain/valueObject/themeId.js';
import { ThemeName } from '../../../domain/valueObject/themeName.js';
import { ThemeColors } from '../../../domain/valueObject/themeColors.js';
import { DefaultThemeMustBeVisibleException } from '../../../domain/exception/defaultThemeMustBeVisible.js';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import { FakeTransactionRunner } from '@shared/application/port/transactionRunnerDouble.js';
import type { IThemeRepository } from '../../../domain/repository/iThemeRepository.js';

// Changer de thème par défaut touche deux thèmes : l'ancien cède le drapeau, le nouveau le
// prend. La base n'accepte qu'un seul défaut à la fois, et vérifie à chaque instruction —
// l'ordre des écritures est donc une règle, pas un détail.

function palette() {
    return new ThemeColors({ '--color-bg': '#fff' });
}

function build(name: string, isDefault: boolean, visible = true): Theme {
    return Theme.rehydrate(new ThemeId(), new ThemeName(name), palette(), visible, isDefault, new Date());
}

function repository(themes: Theme[]) {
    const writes: string[] = [];
    const repo: IThemeRepository = {
        findById: async id => themes.find(t => t.getId().getValue() === id.getValue()) ?? null,
        findAll: async () => themes,
        isEmpty: async () => themes.length === 0,
        save: async theme => void writes.push(`${theme.getName().getValue()}:${theme.isDefault()}`),
    };
    return { repo, writes };
}

describe('SetDefaultThemeHandler', () => {
    it('retire le drapeau à l’ancien AVANT de le donner au nouveau', async () => {
        const previous = build('sable', true);
        const next = build('forêt', false);
        const { repo, writes } = repository([previous, next]);
        const tx = new FakeTransactionRunner();

        await new SetDefaultThemeHandler(repo, tx).handle(new SetDefaultThemeCommand(next.getId().getValue()));

        // L'ordre est l'objet du test : inversé, la contrainte unique en base refuserait.
        expect(writes).toEqual(['sable:false', 'forêt:true']);
        expect(tx.committed).toBe(1);
    });

    it('ne fait rien si le thème est déjà le défaut', async () => {
        const current = build('sable', true);
        const { repo, writes } = repository([current]);
        const tx = new FakeTransactionRunner();

        await new SetDefaultThemeHandler(repo, tx).handle(new SetDefaultThemeCommand(current.getId().getValue()));

        expect(writes).toEqual([]);
        expect(tx.started).toBe(0);
    });

    it('rend 404 pour un thème inconnu, sans ouvrir de transaction', async () => {
        const { repo } = repository([build('sable', true)]);
        const tx = new FakeTransactionRunner();

        await expect(
            new SetDefaultThemeHandler(repo, tx).handle(new SetDefaultThemeCommand('inconnu')),
        ).rejects.toThrow(NotFoundError);

        expect(tx.started).toBe(0);
    });

    it('refuse de désigner un thème masqué', async () => {
        const previous = build('sable', true);
        const hidden = build('forêt', false, false);
        const { repo } = repository([previous, hidden]);
        const tx = new FakeTransactionRunner();

        await expect(
            new SetDefaultThemeHandler(repo, tx).handle(new SetDefaultThemeCommand(hidden.getId().getValue())),
        ).rejects.toThrow(DefaultThemeMustBeVisibleException);

        // Le refus tombe avant la moindre écriture : aucune transaction n'est même ouverte,
        // et l'ancien défaut n'a pas été touché — ni en base, ni en mémoire.
        expect(tx.started).toBe(0);
        expect(previous.isDefault()).toBe(true);
    });
});
