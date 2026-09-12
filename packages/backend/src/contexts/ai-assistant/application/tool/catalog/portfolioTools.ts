import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { LanguageEnum } from '@contexts/portfolio/application/command/addPortfolioLanguage/addPortfolioLanguageCommand';
import { CreatePortfolioCommand } from '@contexts/portfolio/application/command/createPortfolio/createPortfolioCommand';
import { AddPortfolioLanguageCommand } from '@contexts/portfolio/application/command/addPortfolioLanguage/addPortfolioLanguageCommand';
import { RemovePortfolioLanguageCommand } from '@contexts/portfolio/application/command/removePortfolioLanguage/removePortfolioLanguageCommand';
import { GetPortfolioQuery } from '@contexts/portfolio/application/query/getPortfolio/getPortfolioQuery';
import { GetPortfolioByIdQuery } from '@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdQuery';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { uuidSchema } from './sharedSchemas';

const languageSchema = z
    .enum(LanguageEnum)
    .describe(
        "A programming language the portfolio owner works with, e.g. 'typescript', 'python', 'php'. " +
            "Use 'other' for anything outside the supported list.",
    );

export function createPortfolioTools(commandBus: CommandBus, queryBus: QueryBus): AnyToolDescriptor[] {
    const readPortfolio = (id: string) => queryBus.dispatch(new GetPortfolioByIdQuery(id));

    return [
        defineTool({
            name: 'get_portfolio',
            description:
                'Get the portfolio and the programming languages it advertises. There is only one portfolio, ' +
                'so no id is needed. Returns nothing if it has not been created yet.',
            scope: ScopeValue.PORTFOLIO,
            access: 'read',
            inputSchema: z.object({}),
            execute: async () => queryBus.dispatch(new GetPortfolioQuery()),
        }),

        defineTool({
            name: 'create_portfolio',
            description:
                'Create the portfolio. Only call this when get_portfolio returns nothing: the application ' +
                'expects a single portfolio to exist.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({}),
            execute: async () => {
                const id = crypto.randomUUID();
                await commandBus.dispatch(new CreatePortfolioCommand(id));
                return readPortfolio(id);
            },
        }),

        defineTool({
            name: 'add_portfolio_language',
            description:
                'Add a programming language to the portfolio. Adding a language that is already listed ' +
                'changes nothing. Returns the updated portfolio.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the portfolio, as returned by get_portfolio.'),
                language: languageSchema,
            }),
            execute: async ({ id, language }) => {
                await commandBus.dispatch(new AddPortfolioLanguageCommand(id, language));
                return readPortfolio(id);
            },
        }),

        defineTool({
            name: 'remove_portfolio_language',
            description: 'Remove a programming language from the portfolio. Returns the updated portfolio.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the portfolio, as returned by get_portfolio.'),
                language: languageSchema,
            }),
            execute: async ({ id, language }) => {
                await commandBus.dispatch(new RemovePortfolioLanguageCommand(id, language));
                return readPortfolio(id);
            },
        }),
    ];
}
