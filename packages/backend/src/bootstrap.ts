import { env } from '@shared/infrastructure/config/env.js';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { MikroOrmTransactionRunner } from '@shared/infrastructure/persistence/mikroOrmTransactionRunner';

import { EntityManager } from '@mikro-orm/postgresql';
import { PostgresOwnerNumberSequence } from '@shared/infrastructure/sequence/postgresOwnerNumberSequence';
import { UploadStorage } from '@shared/infrastructure/upload/uploadStorage';
import { ILogger } from '@shared/application/port/iLogger';

export function bootstrap(
    em: EntityManager,
    _logger: ILogger,
): {
    commandBus: CommandBus;
    queryBus: QueryBus;
} {
    const repos = {};
    const commandBus = new CommandBus();
    const queryBus = new QueryBus();

    return { commandBus, queryBus };
}
