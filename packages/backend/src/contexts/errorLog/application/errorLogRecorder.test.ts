import { describe, expect, it, vi } from 'vitest';
import { ErrorLogRecorder } from './errorLogRecorder.js';
import type { IErrorLogRepository } from '../domain/repository/iErrorLogRepository.js';

// Le plafond de lignes est la seule chose qui borne la table : sans lui, une boucle d'erreurs
// remplit la base.

function repositorySpy() {
    const record = vi.fn(async () => {});
    const trim = vi.fn(async () => 0);
    const repository = {
        record,
        trim,
        search: vi.fn(),
        purge: vi.fn(),
    } as unknown as IErrorLogRepository;
    return { repository, record, trim };
}

describe('ErrorLogRecorder', () => {
    it('écrit chaque erreur reçue', async () => {
        const { repository, record } = repositorySpy();

        await new ErrorLogRecorder(repository).record({ origin: 'back', message: 'boom' });

        expect(record).toHaveBeenCalledTimes(1);
    });

    it('n’élague pas à chaque écriture', async () => {
        const { repository, trim } = repositorySpy();
        const recorder = new ErrorLogRecorder(repository, 100);

        for (let i = 0; i < 10; i++) await recorder.record({ origin: 'front', message: `boom ${i}` });

        expect(trim).not.toHaveBeenCalled();
    });

    it('élague au plafond demandé une fois le seuil d’écritures franchi', async () => {
        const { repository, trim } = repositorySpy();
        const recorder = new ErrorLogRecorder(repository, 100);

        for (let i = 0; i < 50; i++) await recorder.record({ origin: 'front', message: `boom ${i}` });

        expect(trim).toHaveBeenCalledTimes(1);
        expect(trim).toHaveBeenCalledWith(100);
    });
});
