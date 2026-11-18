import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { ToolRegistry } from '../toolRegistry';
import { createProjectTools } from './projectTools';
import { createFeatureTools } from './featureTools';
import { createTicketTools } from './ticketTools';
import { createIdeaTools } from './ideaTools';
import { createPortfolioTools } from './portfolioTools';
import { createPageTools } from './pageTools';
import { createReferenceTools } from './referenceTools';
import { createUploadTools } from './uploadTools';
import { createCvTools } from './cvTools';
import { createThemeTools } from './themeTools';
import { createSiteTools } from './siteTools';
import { ILogger } from '@shared/application/port/iLogger';

/** Builds the single registry shared by every MCP transport. */
export function createToolRegistry(commandBus: CommandBus, queryBus: QueryBus, logger: ILogger): ToolRegistry {
    const registry = new ToolRegistry(logger);

    registry.register(
        ...createProjectTools(commandBus, queryBus),
        ...createFeatureTools(commandBus, queryBus),
        ...createTicketTools(commandBus, queryBus),
        ...createIdeaTools(commandBus, queryBus),
        ...createPortfolioTools(commandBus, queryBus),
        ...createPageTools(commandBus, queryBus),
        ...createReferenceTools(queryBus),
        ...createUploadTools(commandBus, queryBus),
        ...createCvTools(commandBus, queryBus),
        ...createThemeTools(commandBus, queryBus),
        ...createSiteTools(commandBus, queryBus),
    );

    return registry;
}
