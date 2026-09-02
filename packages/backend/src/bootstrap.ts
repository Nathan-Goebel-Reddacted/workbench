import { env } from '@shared/infrastructure/config/env.js';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';

// --- User ---
import { UserFactory } from '@contexts/user/domain/factory/userFactory';
import { CreateUserCommand } from '@contexts/user/application/command/createUser/createUserCommand';
import { CreateUserHandler } from '@contexts/user/application/command/createUser/createUserHandler';
import { DeleteUserCommand } from '@contexts/user/application/command/deleteUser/deleteUserCommand';
import { DeleteUserHandler } from '@contexts/user/application/command/deleteUser/deleteUserHandler';
import { UpdateUserRolesCommand } from '@contexts/user/application/command/updateUserRoles/updateUserRolesCommand';
import { UpdateUserRolesHandler } from '@contexts/user/application/command/updateUserRoles/updateUserRolesHandler';
import { InvalidateUserSessionsCommand } from '@contexts/user/application/command/invalidateUserSessions/invalidateUserSessionsCommand';
import { InvalidateUserSessionsHandler } from '@contexts/user/application/command/invalidateUserSessions/invalidateUserSessionsHandler';
import { GetUserByIdQuery } from '@contexts/user/application/query/getUserById/getUserByIdQuery';
import { GetUserByIdHandler } from '@contexts/user/application/query/getUserById/getUserByIdHandler';
import { GetUserByEmailQuery } from '@contexts/user/application/query/getUserByEmail/getUserByEmailQuery';
import { GetUserByEmailHandler } from '@contexts/user/application/query/getUserByEmail/getUserByEmailHandler';
import { GetAllUsersQuery } from '@contexts/user/application/query/getAllUsers/getAllUsersQuery';
import { GetAllUsersHandler } from '@contexts/user/application/query/getAllUsers/getAllUsersHandler';

// --- Portfolio ---
import { PortfolioFactory } from '@contexts/portfolio/domain/factory/portfolioFactory';
import { CreatePortfolioCommand } from '@contexts/portfolio/application/command/createPortfolio/createPortfolioCommand';
import { CreatePortfolioHandler } from '@contexts/portfolio/application/command/createPortfolio/createPortfolioHandler';
import { AddPortfolioLanguageCommand } from '@contexts/portfolio/application/command/addPortfolioLanguage/addPortfolioLanguageCommand';
import { AddPortfolioLanguageHandler } from '@contexts/portfolio/application/command/addPortfolioLanguage/addPortfolioLanguageHandler';
import { RemovePortfolioLanguageCommand } from '@contexts/portfolio/application/command/removePortfolioLanguage/removePortfolioLanguageCommand';
import { RemovePortfolioLanguageHandler } from '@contexts/portfolio/application/command/removePortfolioLanguage/removePortfolioLanguageHandler';
import { GetPortfolioByIdQuery } from '@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdQuery';
import { GetPortfolioByIdHandler } from '@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdHandler';
import { GetPortfolioQuery } from '@contexts/portfolio/application/query/getPortfolio/getPortfolioQuery';
import { GetPortfolioHandler } from '@contexts/portfolio/application/query/getPortfolio/getPortfolioHandler';
import { MikroOrmTransactionRunner } from '@shared/infrastructure/persistence/mikroOrmTransactionRunner';

import { EntityManager } from '@mikro-orm/postgresql';
import { PostgresOwnerNumberSequence } from '@shared/infrastructure/sequence/postgresOwnerNumberSequence';
import { UserRepository } from '@contexts/user/infrastructure/repository/userRepository';
import { PortfolioRepository } from '@contexts/portfolio/infrastructure/repository/portfolioRepository';
import { UploadStorage } from '@shared/infrastructure/upload/uploadStorage';
import { ILogger } from '@shared/application/port/iLogger';

export function bootstrap(
    em: EntityManager,
    _logger: ILogger,
): {
    commandBus: CommandBus;
    queryBus: QueryBus;
} {
    const repos = {
        user: new UserRepository(em),
        portfolio: new PortfolioRepository(em),
    };
    const commandBus = new CommandBus();
    const queryBus = new QueryBus();

    const userFactory = new UserFactory();
    const portfolioFactory = new PortfolioFactory();

    // User
    commandBus.register(CreateUserCommand.commandName, new CreateUserHandler(repos.user, userFactory));
    commandBus.register(UpdateUserRolesCommand.commandName, new UpdateUserRolesHandler(repos.user, userFactory));
    commandBus.register(InvalidateUserSessionsCommand.commandName, new InvalidateUserSessionsHandler(repos.user));
    queryBus.register(GetUserByIdQuery.queryName, new GetUserByIdHandler(repos.user));
    queryBus.register(GetUserByEmailQuery.queryName, new GetUserByEmailHandler(repos.user));
    queryBus.register(GetAllUsersQuery.queryName, new GetAllUsersHandler(repos.user));

    // Portfolio
    commandBus.register(
        CreatePortfolioCommand.commandName,
        new CreatePortfolioHandler(repos.portfolio, portfolioFactory),
    );
    commandBus.register(AddPortfolioLanguageCommand.commandName, new AddPortfolioLanguageHandler(repos.portfolio));
    commandBus.register(
        RemovePortfolioLanguageCommand.commandName,
        new RemovePortfolioLanguageHandler(repos.portfolio),
    );
    queryBus.register(GetPortfolioByIdQuery.queryName, new GetPortfolioByIdHandler(repos.portfolio));
    queryBus.register(GetPortfolioQuery.queryName, new GetPortfolioHandler(repos.portfolio));

    return { commandBus, queryBus };
}
