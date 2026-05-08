import { CommandBus } from "@shared/application/command/commandBus";
import { QueryBus } from "@shared/application/query/queryBus";

// --- User ---
import { UserFactory } from "@contexts/user/domain/factory/userFactory";
import { CreateUserCommand } from "@contexts/user/application/command/createUser/createUserCommand";
import { CreateUserHandler } from "@contexts/user/application/command/createUser/createUserHandler";
import { DeleteUserCommand } from "@contexts/user/application/command/deleteUser/deleteUserCommand";
import { DeleteUserHandler } from "@contexts/user/application/command/deleteUser/deleteUserHandler";
import { UpdateUserRolesCommand } from "@contexts/user/application/command/updateUserRoles/updateUserRolesCommand";
import { UpdateUserRolesHandler } from "@contexts/user/application/command/updateUserRoles/updateUserRolesHandler";
import { GetUserByIdQuery } from "@contexts/user/application/query/getUserById/getUserByIdQuery";
import { GetUserByIdHandler } from "@contexts/user/application/query/getUserById/getUserByIdHandler";
import { GetUserByEmailQuery } from "@contexts/user/application/query/getUserByEmail/getUserByEmailQuery";
import { GetUserByEmailHandler } from "@contexts/user/application/query/getUserByEmail/getUserByEmailHandler";
import { GetAllUsersQuery } from "@contexts/user/application/query/getAllUsers/getAllUsersQuery";
import { GetAllUsersHandler } from "@contexts/user/application/query/getAllUsers/getAllUsersHandler";

// --- Portfolio ---
import { PortfolioFactory } from "@contexts/portfolio/domain/factory/portfolioFactory";
import { CreatePortfolioCommand } from "@contexts/portfolio/application/command/createPortfolio/createPortfolioCommand";
import { CreatePortfolioHandler } from "@contexts/portfolio/application/command/createPortfolio/createPortfolioHandler";
import { UpdatePortfolioDescriptionCommand } from "@contexts/portfolio/application/command/updatePortfolioDescription/updatePortfolioDescriptionCommand";
import { UpdatePortfolioDescriptionHandler } from "@contexts/portfolio/application/command/updatePortfolioDescription/updatePortfolioDescriptionHandler";
import { AddPortfolioLinkCommand } from "@contexts/portfolio/application/command/addPortfolioLink/addPortfolioLinkCommand";
import { AddPortfolioLinkHandler } from "@contexts/portfolio/application/command/addPortfolioLink/addPortfolioLinkHandler";
import { RemovePortfolioLinkCommand } from "@contexts/portfolio/application/command/removePortfolioLink/removePortfolioLinkCommand";
import { RemovePortfolioLinkHandler } from "@contexts/portfolio/application/command/removePortfolioLink/removePortfolioLinkHandler";
import { AddPortfolioLanguageCommand } from "@contexts/portfolio/application/command/addPortfolioLanguage/addPortfolioLanguageCommand";
import { AddPortfolioLanguageHandler } from "@contexts/portfolio/application/command/addPortfolioLanguage/addPortfolioLanguageHandler";
import { RemovePortfolioLanguageCommand } from "@contexts/portfolio/application/command/removePortfolioLanguage/removePortfolioLanguageCommand";
import { RemovePortfolioLanguageHandler } from "@contexts/portfolio/application/command/removePortfolioLanguage/removePortfolioLanguageHandler";
import { GetPortfolioByIdQuery } from "@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdQuery";
import { GetPortfolioByIdHandler } from "@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdHandler";
import { GetPortfolioByUserIdQuery } from "@contexts/portfolio/application/query/getPortfolioByUserId/getPortfolioByUserIdQuery";
import { GetPortfolioByUserIdHandler } from "@contexts/portfolio/application/query/getPortfolioByUserId/getPortfolioByUserIdHandler";

// --- Project ---
import { ProjectFactory } from "@contexts/project/domain/factory/projectFactory";
import { CreateProjectCommand } from "@contexts/project/application/command/createProject/createProjectCommand";
import { CreateProjectHandler } from "@contexts/project/application/command/createProject/createProjectHandler";
import { AddProjectDocumentCommand } from "@contexts/project/application/command/addProjectDocument/addProjectDocumentCommand";
import { AddProjectDocumentHandler } from "@contexts/project/application/command/addProjectDocument/addProjectDocumentHandler";
import { RemoveProjectDocumentCommand } from "@contexts/project/application/command/removeProjectDocument/removeProjectDocumentCommand";
import { RemoveProjectDocumentHandler } from "@contexts/project/application/command/removeProjectDocument/removeProjectDocumentHandler";
import { AddProjectLinkCommand } from "@contexts/project/application/command/addProjectLink/addProjectLinkCommand";
import { AddProjectLinkHandler } from "@contexts/project/application/command/addProjectLink/addProjectLinkHandler";
import { RemoveProjectLinkCommand } from "@contexts/project/application/command/removeProjectLink/removeProjectLinkCommand";
import { RemoveProjectLinkHandler } from "@contexts/project/application/command/removeProjectLink/removeProjectLinkHandler";
import { GetProjectByIdQuery } from "@contexts/project/application/query/getProjectById/getProjectByIdQuery";
import { GetProjectByIdHandler } from "@contexts/project/application/query/getProjectById/getProjectByIdHandler";

// --- Feature ---
import { FeatureFactory } from "@contexts/feature/domain/factory/featureFactory";
import { CreateFeatureCommand } from "@contexts/feature/application/command/createFeature/createFeatureCommand";
import { CreateFeatureHandler } from "@contexts/feature/application/command/createFeature/createFeatureHandler";
import { AddFeatureDocumentCommand } from "@contexts/feature/application/command/addFeatureDocument/addFeatureDocumentCommand";
import { AddFeatureDocumentHandler } from "@contexts/feature/application/command/addFeatureDocument/addFeatureDocumentHandler";
import { RemoveFeatureDocumentCommand } from "@contexts/feature/application/command/removeFeatureDocument/removeFeatureDocumentCommand";
import { RemoveFeatureDocumentHandler } from "@contexts/feature/application/command/removeFeatureDocument/removeFeatureDocumentHandler";
import { GetFeatureByIdQuery } from "@contexts/feature/application/query/getFeatureById/getFeatureByIdQuery";
import { GetFeatureByIdHandler } from "@contexts/feature/application/query/getFeatureById/getFeatureByIdHandler";
import { GetFeaturesByProjectIdQuery } from "@contexts/feature/application/query/getFeaturesByProjectId/getFeaturesByProjectIdQuery";
import { GetFeaturesByProjectIdHandler } from "@contexts/feature/application/query/getFeaturesByProjectId/getFeaturesByProjectIdHandler";

// --- Ticket ---
import { TicketFactory } from "@contexts/ticket/domain/factory/ticketFactory";
import { CreateTicketCommand } from "@contexts/ticket/application/command/createTicket/createTicketCommand";
import { CreateTicketHandler } from "@contexts/ticket/application/command/createTicket/createTicketHandler";
import { ChangeTicketStatusCommand } from "@contexts/ticket/application/command/changeTicketStatus/changeTicketStatusCommand";
import { ChangeTicketStatusHandler } from "@contexts/ticket/application/command/changeTicketStatus/changeTicketStatusHandler";
import { AddTicketNoteCommand } from "@contexts/ticket/application/command/addTicketNote/addTicketNoteCommand";
import { AddTicketNoteHandler } from "@contexts/ticket/application/command/addTicketNote/addTicketNoteHandler";
import { AddTicketDocumentCommand } from "@contexts/ticket/application/command/addTicketDocument/addTicketDocumentCommand";
import { AddTicketDocumentHandler } from "@contexts/ticket/application/command/addTicketDocument/addTicketDocumentHandler";
import { RemoveTicketDocumentCommand } from "@contexts/ticket/application/command/removeTicketDocument/removeTicketDocumentCommand";
import { RemoveTicketDocumentHandler } from "@contexts/ticket/application/command/removeTicketDocument/removeTicketDocumentHandler";
import { GetTicketByIdQuery } from "@contexts/ticket/application/query/getTicketById/getTicketByIdQuery";
import { GetTicketByIdHandler } from "@contexts/ticket/application/query/getTicketById/getTicketByIdHandler";
import { GetTicketsByFeatureIdQuery } from "@contexts/ticket/application/query/getTicketsByFeatureId/getTicketsByFeatureIdQuery";
import { GetTicketsByFeatureIdHandler } from "@contexts/ticket/application/query/getTicketsByFeatureId/getTicketsByFeatureIdHandler";

// --- Idea ---
import { IdeaFactory } from "@contexts/idea/domain/factory/ideaFactory";
import { CreateIdeaCommand } from "@contexts/idea/application/command/createIdea/createIdeaCommand";
import { CreateIdeaHandler } from "@contexts/idea/application/command/createIdea/createIdeaHandler";
import { AddIdeaDocumentCommand } from "@contexts/idea/application/command/addIdeaDocument/addIdeaDocumentCommand";
import { AddIdeaDocumentHandler } from "@contexts/idea/application/command/addIdeaDocument/addIdeaDocumentHandler";
import { RemoveIdeaDocumentCommand } from "@contexts/idea/application/command/removeIdeaDocument/removeIdeaDocumentCommand";
import { RemoveIdeaDocumentHandler } from "@contexts/idea/application/command/removeIdeaDocument/removeIdeaDocumentHandler";
import { AddIdeaLinkCommand } from "@contexts/idea/application/command/addIdeaLink/addIdeaLinkCommand";
import { AddIdeaLinkHandler } from "@contexts/idea/application/command/addIdeaLink/addIdeaLinkHandler";
import { RemoveIdeaLinkCommand } from "@contexts/idea/application/command/removeIdeaLink/removeIdeaLinkCommand";
import { RemoveIdeaLinkHandler } from "@contexts/idea/application/command/removeIdeaLink/removeIdeaLinkHandler";
import { GetIdeaByIdQuery } from "@contexts/idea/application/query/getIdeaById/getIdeaByIdQuery";
import { GetIdeaByIdHandler } from "@contexts/idea/application/query/getIdeaById/getIdeaByIdHandler";

// --- ContentEditor ---
import { PageLayoutFactory } from "@contexts/contentEditor/domain/factory/pageLayoutFactory";
import { CreatePageLayoutCommand } from "@contexts/contentEditor/application/command/createPageLayout/createPageLayoutCommand";
import { CreatePageLayoutHandler } from "@contexts/contentEditor/application/command/createPageLayout/createPageLayoutHandler";
import { AddSectionCommand } from "@contexts/contentEditor/application/command/addSection/addSectionCommand";
import { AddSectionHandler } from "@contexts/contentEditor/application/command/addSection/addSectionHandler";
import { RemoveSectionCommand } from "@contexts/contentEditor/application/command/removeSection/removeSectionCommand";
import { RemoveSectionHandler } from "@contexts/contentEditor/application/command/removeSection/removeSectionHandler";
import { MoveSectionCommand } from "@contexts/contentEditor/application/command/moveSection/moveSectionCommand";
import { MoveSectionHandler } from "@contexts/contentEditor/application/command/moveSection/moveSectionHandler";
import { GetPageLayoutByIdQuery } from "@contexts/contentEditor/application/query/getPageLayoutById/getPageLayoutByIdQuery";
import { GetPageLayoutByIdHandler } from "@contexts/contentEditor/application/query/getPageLayoutById/getPageLayoutByIdHandler";
import { GetPageLayoutByRefQuery } from "@contexts/contentEditor/application/query/getPageLayoutByRef/getPageLayoutByRefQuery";
import { GetPageLayoutByRefHandler } from "@contexts/contentEditor/application/query/getPageLayoutByRef/getPageLayoutByRefHandler";

// --- AI Assistant ---
import { AgentToolFactory } from "@contexts/ai-assistant/domain/factory/agentToolFactory";
import { CreateAgentToolCommand } from "@contexts/ai-assistant/application/command/createAgentTool/createAgentToolCommand";
import { CreateAgentToolHandler } from "@contexts/ai-assistant/application/command/createAgentTool/createAgentToolHandler";
import { UpdateAgentToolNameCommand } from "@contexts/ai-assistant/application/command/updateAgentToolName/updateAgentToolNameCommand";
import { UpdateAgentToolNameHandler } from "@contexts/ai-assistant/application/command/updateAgentToolName/updateAgentToolNameHandler";
import { UpdateAgentToolPermissionCommand } from "@contexts/ai-assistant/application/command/updateAgentToolPermission/updateAgentToolPermissionCommand";
import { UpdateAgentToolPermissionHandler } from "@contexts/ai-assistant/application/command/updateAgentToolPermission/updateAgentToolPermissionHandler";
import { AddAgentToolScopeCommand } from "@contexts/ai-assistant/application/command/addAgentToolScope/addAgentToolScopeCommand";
import { AddAgentToolScopeHandler } from "@contexts/ai-assistant/application/command/addAgentToolScope/addAgentToolScopeHandler";
import { RemoveAgentToolScopeCommand } from "@contexts/ai-assistant/application/command/removeAgentToolScope/removeAgentToolScopeCommand";
import { RemoveAgentToolScopeHandler } from "@contexts/ai-assistant/application/command/removeAgentToolScope/removeAgentToolScopeHandler";
import { RotateAgentToolTokenCommand } from "@contexts/ai-assistant/application/command/rotateAgentToolToken/rotateAgentToolTokenCommand";
import { RotateAgentToolTokenHandler } from "@contexts/ai-assistant/application/command/rotateAgentToolToken/rotateAgentToolTokenHandler";
import { GetAgentToolByIdQuery } from "@contexts/ai-assistant/application/query/getAgentToolById/getAgentToolByIdQuery";
import { GetAgentToolByIdHandler } from "@contexts/ai-assistant/application/query/getAgentToolById/getAgentToolByIdHandler";
import { GetAgentToolsByUserIdQuery } from "@contexts/ai-assistant/application/query/getAgentToolsByUserId/getAgentToolsByUserIdQuery";
import { GetAgentToolsByUserIdHandler } from "@contexts/ai-assistant/application/query/getAgentToolsByUserId/getAgentToolsByUserIdHandler";

import { EntityManager } from "@mikro-orm/postgresql";
import { UserRepository } from "@contexts/user/infrastructure/repository/userRepository";
import { PortfolioRepository } from "@contexts/portfolio/infrastructure/repository/portfolioRepository";
import { ProjectRepository } from "@contexts/project/infrastructure/repository/projectRepository";
import { FeatureRepository } from "@contexts/feature/infrastructure/repository/featureRepository";
import { TicketRepository } from "@contexts/ticket/infrastructure/repository/ticketRepository";
import { IdeaRepository } from "@contexts/idea/infrastructure/repository/ideaRepository";
import { PageLayoutRepository } from "@contexts/contentEditor/infrastructure/repository/pageLayoutRepository";
import { AgentToolRepository } from "@contexts/ai-assistant/infrastructure/repository/agentToolRepository";

export function bootstrap(em: EntityManager): { commandBus: CommandBus; queryBus: QueryBus } {
    const repos = {
        user: new UserRepository(em),
        portfolio: new PortfolioRepository(em),
        project: new ProjectRepository(em),
        feature: new FeatureRepository(em),
        ticket: new TicketRepository(em),
        idea: new IdeaRepository(em),
        pageLayout: new PageLayoutRepository(em),
        agentTool: new AgentToolRepository(em),
    };
    const commandBus = new CommandBus();
    const queryBus = new QueryBus();

    const userFactory = new UserFactory();
    const portfolioFactory = new PortfolioFactory();
    const projectFactory = new ProjectFactory();
    const featureFactory = new FeatureFactory();
    const ticketFactory = new TicketFactory();
    const ideaFactory = new IdeaFactory();
    const pageLayoutFactory = new PageLayoutFactory();
    const agentToolFactory = new AgentToolFactory();

    // User
    commandBus.register(CreateUserCommand.commandName, new CreateUserHandler(repos.user, userFactory));
    commandBus.register(DeleteUserCommand.commandName, new DeleteUserHandler(repos.user));
    commandBus.register(UpdateUserRolesCommand.commandName, new UpdateUserRolesHandler(repos.user, userFactory));
    queryBus.register(GetUserByIdQuery.queryName, new GetUserByIdHandler(repos.user));
    queryBus.register(GetUserByEmailQuery.queryName, new GetUserByEmailHandler(repos.user));
    queryBus.register(GetAllUsersQuery.queryName, new GetAllUsersHandler(repos.user));

    // Portfolio
    commandBus.register(CreatePortfolioCommand.commandName, new CreatePortfolioHandler(repos.portfolio, portfolioFactory));
    commandBus.register(UpdatePortfolioDescriptionCommand.commandName, new UpdatePortfolioDescriptionHandler(repos.portfolio));
    commandBus.register(AddPortfolioLinkCommand.commandName, new AddPortfolioLinkHandler(repos.portfolio));
    commandBus.register(RemovePortfolioLinkCommand.commandName, new RemovePortfolioLinkHandler(repos.portfolio));
    commandBus.register(AddPortfolioLanguageCommand.commandName, new AddPortfolioLanguageHandler(repos.portfolio));
    commandBus.register(RemovePortfolioLanguageCommand.commandName, new RemovePortfolioLanguageHandler(repos.portfolio));
    queryBus.register(GetPortfolioByIdQuery.queryName, new GetPortfolioByIdHandler(repos.portfolio));
    queryBus.register(GetPortfolioByUserIdQuery.queryName, new GetPortfolioByUserIdHandler(repos.portfolio));

    // Project
    commandBus.register(CreateProjectCommand.commandName, new CreateProjectHandler(repos.project, projectFactory));
    commandBus.register(AddProjectDocumentCommand.commandName, new AddProjectDocumentHandler(repos.project));
    commandBus.register(RemoveProjectDocumentCommand.commandName, new RemoveProjectDocumentHandler(repos.project));
    commandBus.register(AddProjectLinkCommand.commandName, new AddProjectLinkHandler(repos.project));
    commandBus.register(RemoveProjectLinkCommand.commandName, new RemoveProjectLinkHandler(repos.project));
    queryBus.register(GetProjectByIdQuery.queryName, new GetProjectByIdHandler(repos.project));

    // Feature
    commandBus.register(CreateFeatureCommand.commandName, new CreateFeatureHandler(repos.feature, featureFactory));
    commandBus.register(AddFeatureDocumentCommand.commandName, new AddFeatureDocumentHandler(repos.feature));
    commandBus.register(RemoveFeatureDocumentCommand.commandName, new RemoveFeatureDocumentHandler(repos.feature));
    queryBus.register(GetFeatureByIdQuery.queryName, new GetFeatureByIdHandler(repos.feature));
    queryBus.register(GetFeaturesByProjectIdQuery.queryName, new GetFeaturesByProjectIdHandler(repos.feature));

    // Ticket
    commandBus.register(CreateTicketCommand.commandName, new CreateTicketHandler(repos.ticket, ticketFactory));
    commandBus.register(ChangeTicketStatusCommand.commandName, new ChangeTicketStatusHandler(repos.ticket));
    commandBus.register(AddTicketNoteCommand.commandName, new AddTicketNoteHandler(repos.ticket));
    commandBus.register(AddTicketDocumentCommand.commandName, new AddTicketDocumentHandler(repos.ticket));
    commandBus.register(RemoveTicketDocumentCommand.commandName, new RemoveTicketDocumentHandler(repos.ticket));
    queryBus.register(GetTicketByIdQuery.queryName, new GetTicketByIdHandler(repos.ticket));
    queryBus.register(GetTicketsByFeatureIdQuery.queryName, new GetTicketsByFeatureIdHandler(repos.ticket));

    // Idea
    commandBus.register(CreateIdeaCommand.commandName, new CreateIdeaHandler(repos.idea, ideaFactory));
    commandBus.register(AddIdeaDocumentCommand.commandName, new AddIdeaDocumentHandler(repos.idea));
    commandBus.register(RemoveIdeaDocumentCommand.commandName, new RemoveIdeaDocumentHandler(repos.idea));
    commandBus.register(AddIdeaLinkCommand.commandName, new AddIdeaLinkHandler(repos.idea));
    commandBus.register(RemoveIdeaLinkCommand.commandName, new RemoveIdeaLinkHandler(repos.idea));
    queryBus.register(GetIdeaByIdQuery.queryName, new GetIdeaByIdHandler(repos.idea));

    // ContentEditor
    commandBus.register(CreatePageLayoutCommand.commandName, new CreatePageLayoutHandler(repos.pageLayout, pageLayoutFactory));
    commandBus.register(AddSectionCommand.commandName, new AddSectionHandler(repos.pageLayout));
    commandBus.register(RemoveSectionCommand.commandName, new RemoveSectionHandler(repos.pageLayout));
    commandBus.register(MoveSectionCommand.commandName, new MoveSectionHandler(repos.pageLayout));
    queryBus.register(GetPageLayoutByIdQuery.queryName, new GetPageLayoutByIdHandler(repos.pageLayout));
    queryBus.register(GetPageLayoutByRefQuery.queryName, new GetPageLayoutByRefHandler(repos.pageLayout));

    // AI Assistant
    commandBus.register(CreateAgentToolCommand.commandName, new CreateAgentToolHandler(repos.agentTool, agentToolFactory));
    commandBus.register(UpdateAgentToolNameCommand.commandName, new UpdateAgentToolNameHandler(repos.agentTool));
    commandBus.register(UpdateAgentToolPermissionCommand.commandName, new UpdateAgentToolPermissionHandler(repos.agentTool));
    commandBus.register(AddAgentToolScopeCommand.commandName, new AddAgentToolScopeHandler(repos.agentTool));
    commandBus.register(RemoveAgentToolScopeCommand.commandName, new RemoveAgentToolScopeHandler(repos.agentTool));
    commandBus.register(RotateAgentToolTokenCommand.commandName, new RotateAgentToolTokenHandler(repos.agentTool));
    queryBus.register(GetAgentToolByIdQuery.queryName, new GetAgentToolByIdHandler(repos.agentTool));
    queryBus.register(GetAgentToolsByUserIdQuery.queryName, new GetAgentToolsByUserIdHandler(repos.agentTool));

    return { commandBus, queryBus };
}
