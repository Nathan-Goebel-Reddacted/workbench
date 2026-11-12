import { describe, expect, it } from 'vitest';
import { pgInvocation } from './pgClient';

const credentials = { user: 'atelier', password: 's3cret', database: 'atelier', host: 'postgres', port: '5432' };
const command = ['psql', '-U', 'atelier', '-d', 'atelier'];

describe('pgInvocation', () => {
    it('passe par le conteneur postgres par défaut', () => {
        const { bin, args } = pgInvocation(credentials, command, undefined);

        expect(bin).toBe('docker');
        expect(args).toEqual(['compose', 'exec', '-T', '-e', 'PGPASSWORD=s3cret', 'postgres', ...command]);
    });

    it('lance le client Postgres lui-même en mode direct', () => {
        const { bin, args, env } = pgInvocation(credentials, command, 'direct');

        expect(bin).toBe('psql');
        expect(args).toEqual(['-U', 'atelier', '-d', 'atelier']);
        expect(env).toMatchObject({ PGHOST: 'postgres', PGPORT: '5432', PGPASSWORD: 's3cret' });
    });

    it('ne met jamais le mot de passe dans la ligne de commande en mode direct', () => {
        const { args } = pgInvocation(credentials, command, 'direct');

        expect(args.join(' ')).not.toContain('s3cret');
    });
});
