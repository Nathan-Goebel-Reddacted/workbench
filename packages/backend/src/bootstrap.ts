import { env } from '@shared/infrastructure/config/env.js';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';

// --- User ---
import { UserFactory } from '@contexts/user/domain/factory/userFactory';
import { CreateUserCommand } from '@contexts/user/application/command/createUser/createUserCommand';
import { CreateUserHandler } from '@contexts/user/application/command/createUser/createUserHandler';
import { DeleteUserCommand } from '@contexts/user/application/command/deleteUser/deleteUserCommand';
import { DeleteUserHandler } from '@contexts/user/application/command/deleteUser/deleteUserHandler';
import { RevokeAgentToolsOnUserDeleted } from '@contexts/ai-assistant/application/listener/revokeAgentToolsOnUserDeleted';
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

// --- Project ---
import { ProjectFactory } from '@contexts/project/domain/factory/projectFactory';
import { CreateProjectCommand } from '@contexts/project/application/command/createProject/createProjectCommand';
import { CreateProjectHandler } from '@contexts/project/application/command/createProject/createProjectHandler';
import { AddProjectDocumentCommand } from '@contexts/project/application/command/addProjectDocument/addProjectDocumentCommand';
import { AddProjectDocumentHandler } from '@contexts/project/application/command/addProjectDocument/addProjectDocumentHandler';
import { RemoveProjectDocumentCommand } from '@contexts/project/application/command/removeProjectDocument/removeProjectDocumentCommand';
import { RemoveProjectDocumentHandler } from '@contexts/project/application/command/removeProjectDocument/removeProjectDocumentHandler';
import { AddProjectLinkCommand } from '@contexts/project/application/command/addProjectLink/addProjectLinkCommand';
import { AddProjectLinkHandler } from '@contexts/project/application/command/addProjectLink/addProjectLinkHandler';
import { RemoveProjectLinkCommand } from '@contexts/project/application/command/removeProjectLink/removeProjectLinkCommand';
import { RemoveProjectLinkHandler } from '@contexts/project/application/command/removeProjectLink/removeProjectLinkHandler';
import { GetProjectByIdQuery } from '@contexts/project/application/query/getProjectById/getProjectByIdQuery';
import { GetProjectByIdHandler } from '@contexts/project/application/query/getProjectById/getProjectByIdHandler';
import { ListProjectsQuery } from '@contexts/project/application/query/listProjects/listProjectsQuery';
import { ListProjectsHandler } from '@contexts/project/application/query/listProjects/listProjectsHandler';
import { UpdateProjectCommand } from '@contexts/project/application/command/updateProject/updateProjectCommand';
import { UpdateProjectHandler } from '@contexts/project/application/command/updateProject/updateProjectHandler';
import { UpdateProjectVisibilityCommand } from '@contexts/project/application/command/updateProjectVisibility/updateProjectVisibilityCommand';
import { UpdateProjectVisibilityHandler } from '@contexts/project/application/command/updateProjectVisibility/updateProjectVisibilityHandler';
import { UpdateFeatureCommand } from '@contexts/feature/application/command/updateFeature/updateFeatureCommand';
import { UpdateFeatureHandler } from '@contexts/feature/application/command/updateFeature/updateFeatureHandler';
import { DeleteFeatureCommand } from '@contexts/feature/application/command/deleteFeature/deleteFeatureCommand';
import { DeleteFeatureHandler } from '@contexts/feature/application/command/deleteFeature/deleteFeatureHandler';

// --- Feature ---
import { FeatureFactory } from '@contexts/feature/domain/factory/featureFactory';
import { CreateFeatureCommand } from '@contexts/feature/application/command/createFeature/createFeatureCommand';
import { CreateFeatureHandler } from '@contexts/feature/application/command/createFeature/createFeatureHandler';
import { AddFeatureDocumentCommand } from '@contexts/feature/application/command/addFeatureDocument/addFeatureDocumentCommand';
import { AddFeatureDocumentHandler } from '@contexts/feature/application/command/addFeatureDocument/addFeatureDocumentHandler';
import { RemoveFeatureDocumentCommand } from '@contexts/feature/application/command/removeFeatureDocument/removeFeatureDocumentCommand';
import { RemoveFeatureDocumentHandler } from '@contexts/feature/application/command/removeFeatureDocument/removeFeatureDocumentHandler';
import { GetFeatureByIdQuery } from '@contexts/feature/application/query/getFeatureById/getFeatureByIdQuery';
import { GetFeatureByIdHandler } from '@contexts/feature/application/query/getFeatureById/getFeatureByIdHandler';
import { GetFeaturesByOwnerQuery } from '@contexts/feature/application/query/getFeaturesByOwner/getFeaturesByOwnerQuery';
import { GetFeaturesByOwnerHandler } from '@contexts/feature/application/query/getFeaturesByOwner/getFeaturesByOwnerHandler';
import { OwnerGateway } from '@contexts/feature/infrastructure/gateway/ownerGateway';
import { FeatureGateway } from '@contexts/ticket/infrastructure/gateway/featureGateway';
import { FeatureTicketsGateway } from '@contexts/feature/infrastructure/gateway/featureTicketsGateway';
import { IdeaFeaturesGateway } from '@contexts/idea/infrastructure/gateway/ideaFeaturesGateway';
import { ProjectCreationGateway } from '@contexts/idea/infrastructure/gateway/projectCreationGateway';
import { ConvertIdeaToProjectCommand } from '@contexts/idea/application/command/convertIdeaToProject/convertIdeaToProjectCommand';
import { ConvertIdeaToProjectHandler } from '@contexts/idea/application/command/convertIdeaToProject/convertIdeaToProjectHandler';
import { MikroOrmTransactionRunner } from '@shared/infrastructure/persistence/mikroOrmTransactionRunner';
import { ReferenceDirectory } from '@contexts/reference/infrastructure/referenceDirectory';
import { ResolveReferenceQuery } from '@contexts/reference/application/query/resolveReference/resolveReferenceQuery';
import { ResolveReferenceHandler } from '@contexts/reference/application/query/resolveReference/resolveReferenceHandler';
import { GetReferenceTreeQuery } from '@contexts/reference/application/query/getReferenceTree/getReferenceTreeQuery';
import { GetReferenceTreeHandler } from '@contexts/reference/application/query/getReferenceTree/getReferenceTreeHandler';

// --- Ticket ---
import { TicketFactory } from '@contexts/ticket/domain/factory/ticketFactory';
import { CreateTicketCommand } from '@contexts/ticket/application/command/createTicket/createTicketCommand';
import { CreateTicketHandler } from '@contexts/ticket/application/command/createTicket/createTicketHandler';
import { ChangeTicketStatusCommand } from '@contexts/ticket/application/command/changeTicketStatus/changeTicketStatusCommand';
import { ChangeTicketStatusHandler } from '@contexts/ticket/application/command/changeTicketStatus/changeTicketStatusHandler';
import { UpdateTicketCommand } from '@contexts/ticket/application/command/updateTicket/updateTicketCommand';
import { UpdateTicketHandler } from '@contexts/ticket/application/command/updateTicket/updateTicketHandler';
import { UpdateTicketNoteCommand } from '@contexts/ticket/application/command/updateTicketNote/updateTicketNoteCommand';
import { UpdateTicketNoteHandler } from '@contexts/ticket/application/command/updateTicketNote/updateTicketNoteHandler';
import { DeleteTicketCommand } from '@contexts/ticket/application/command/deleteTicket/deleteTicketCommand';
import { DeleteTicketHandler } from '@contexts/ticket/application/command/deleteTicket/deleteTicketHandler';
import { AddTicketNoteCommand } from '@contexts/ticket/application/command/addTicketNote/addTicketNoteCommand';
import { AddTicketNoteHandler } from '@contexts/ticket/application/command/addTicketNote/addTicketNoteHandler';
import { AddTicketDocumentCommand } from '@contexts/ticket/application/command/addTicketDocument/addTicketDocumentCommand';
import { AddTicketDocumentHandler } from '@contexts/ticket/application/command/addTicketDocument/addTicketDocumentHandler';
import { RemoveTicketDocumentCommand } from '@contexts/ticket/application/command/removeTicketDocument/removeTicketDocumentCommand';
import { RemoveTicketDocumentHandler } from '@contexts/ticket/application/command/removeTicketDocument/removeTicketDocumentHandler';
import { GetTicketByIdQuery } from '@contexts/ticket/application/query/getTicketById/getTicketByIdQuery';
import { GetTicketByIdHandler } from '@contexts/ticket/application/query/getTicketById/getTicketByIdHandler';
import { GetTicketsByFeatureIdQuery } from '@contexts/ticket/application/query/getTicketsByFeatureId/getTicketsByFeatureIdQuery';
import { GetTicketsByFeatureIdHandler } from '@contexts/ticket/application/query/getTicketsByFeatureId/getTicketsByFeatureIdHandler';

// --- Idea ---
import { IdeaFactory } from '@contexts/idea/domain/factory/ideaFactory';
import { CreateIdeaCommand } from '@contexts/idea/application/command/createIdea/createIdeaCommand';
import { CreateIdeaHandler } from '@contexts/idea/application/command/createIdea/createIdeaHandler';
import { UpdateIdeaCommand } from '@contexts/idea/application/command/updateIdea/updateIdeaCommand';
import { UpdateIdeaHandler } from '@contexts/idea/application/command/updateIdea/updateIdeaHandler';
import { DeleteIdeaCommand } from '@contexts/idea/application/command/deleteIdea/deleteIdeaCommand';
import { DeleteIdeaHandler } from '@contexts/idea/application/command/deleteIdea/deleteIdeaHandler';
import { AddIdeaDocumentCommand } from '@contexts/idea/application/command/addIdeaDocument/addIdeaDocumentCommand';
import { AddIdeaDocumentHandler } from '@contexts/idea/application/command/addIdeaDocument/addIdeaDocumentHandler';
import { RemoveIdeaDocumentCommand } from '@contexts/idea/application/command/removeIdeaDocument/removeIdeaDocumentCommand';
import { RemoveIdeaDocumentHandler } from '@contexts/idea/application/command/removeIdeaDocument/removeIdeaDocumentHandler';
import { AddIdeaLinkCommand } from '@contexts/idea/application/command/addIdeaLink/addIdeaLinkCommand';
import { AddIdeaLinkHandler } from '@contexts/idea/application/command/addIdeaLink/addIdeaLinkHandler';
import { RemoveIdeaLinkCommand } from '@contexts/idea/application/command/removeIdeaLink/removeIdeaLinkCommand';
import { RemoveIdeaLinkHandler } from '@contexts/idea/application/command/removeIdeaLink/removeIdeaLinkHandler';
import { GetIdeaByIdQuery } from '@contexts/idea/application/query/getIdeaById/getIdeaByIdQuery';
import { GetIdeaByIdHandler } from '@contexts/idea/application/query/getIdeaById/getIdeaByIdHandler';
import { ListIdeasQuery } from '@contexts/idea/application/query/listIdeas/listIdeasQuery';
import { ListIdeasHandler } from '@contexts/idea/application/query/listIdeas/listIdeasHandler';

// --- ContentEditor ---
import { PageLayoutFactory } from '@contexts/contentEditor/domain/factory/pageLayoutFactory';
import { CreatePageLayoutCommand } from '@contexts/contentEditor/application/command/createPageLayout/createPageLayoutCommand';
import { CreatePageLayoutHandler } from '@contexts/contentEditor/application/command/createPageLayout/createPageLayoutHandler';
import { AddSectionCommand } from '@contexts/contentEditor/application/command/addSection/addSectionCommand';
import { AddSectionHandler } from '@contexts/contentEditor/application/command/addSection/addSectionHandler';
import { RemoveSectionCommand } from '@contexts/contentEditor/application/command/removeSection/removeSectionCommand';
import { RemoveSectionHandler } from '@contexts/contentEditor/application/command/removeSection/removeSectionHandler';
import { MoveSectionCommand } from '@contexts/contentEditor/application/command/moveSection/moveSectionCommand';
import { MoveSectionHandler } from '@contexts/contentEditor/application/command/moveSection/moveSectionHandler';
import { UpdateSectionContentCommand } from '@contexts/contentEditor/application/command/updateSectionContent/updateSectionContentCommand';
import { UpdateSectionContentHandler } from '@contexts/contentEditor/application/command/updateSectionContent/updateSectionContentHandler';
import { GetPageLayoutByIdQuery } from '@contexts/contentEditor/application/query/getPageLayoutById/getPageLayoutByIdQuery';
import { GetPageLayoutByIdHandler } from '@contexts/contentEditor/application/query/getPageLayoutById/getPageLayoutByIdHandler';
import { GetPageLayoutByRefQuery } from '@contexts/contentEditor/application/query/getPageLayoutByRef/getPageLayoutByRefQuery';
import { GetPageLayoutByRefHandler } from '@contexts/contentEditor/application/query/getPageLayoutByRef/getPageLayoutByRefHandler';
import { ListMediaImagesQuery } from '@contexts/contentEditor/application/query/listMediaImages/listMediaImagesQuery';
import { ListMediaImagesHandler } from '@contexts/contentEditor/application/query/listMediaImages/listMediaImagesHandler';

// --- AI Assistant ---
import { AgentToolFactory } from '@contexts/ai-assistant/domain/factory/agentToolFactory';
import { CreateAgentToolCommand } from '@contexts/ai-assistant/application/command/createAgentTool/createAgentToolCommand';
import { CreateAgentToolHandler } from '@contexts/ai-assistant/application/command/createAgentTool/createAgentToolHandler';
import { UpdateAgentToolNameCommand } from '@contexts/ai-assistant/application/command/updateAgentToolName/updateAgentToolNameCommand';
import { UpdateAgentToolNameHandler } from '@contexts/ai-assistant/application/command/updateAgentToolName/updateAgentToolNameHandler';
import { UpdateAgentToolPermissionCommand } from '@contexts/ai-assistant/application/command/updateAgentToolPermission/updateAgentToolPermissionCommand';
import { UpdateAgentToolPermissionHandler } from '@contexts/ai-assistant/application/command/updateAgentToolPermission/updateAgentToolPermissionHandler';
import { AddAgentToolScopeCommand } from '@contexts/ai-assistant/application/command/addAgentToolScope/addAgentToolScopeCommand';
import { AddAgentToolScopeHandler } from '@contexts/ai-assistant/application/command/addAgentToolScope/addAgentToolScopeHandler';
import { RemoveAgentToolScopeCommand } from '@contexts/ai-assistant/application/command/removeAgentToolScope/removeAgentToolScopeCommand';
import { RemoveAgentToolScopeHandler } from '@contexts/ai-assistant/application/command/removeAgentToolScope/removeAgentToolScopeHandler';
import { RotateAgentToolTokenCommand } from '@contexts/ai-assistant/application/command/rotateAgentToolToken/rotateAgentToolTokenCommand';
import { RotateAgentToolTokenHandler } from '@contexts/ai-assistant/application/command/rotateAgentToolToken/rotateAgentToolTokenHandler';
import { GetAgentToolByIdQuery } from '@contexts/ai-assistant/application/query/getAgentToolById/getAgentToolByIdQuery';
import { GetAgentToolByIdHandler } from '@contexts/ai-assistant/application/query/getAgentToolById/getAgentToolByIdHandler';
import { GetAgentToolsByUserIdQuery } from '@contexts/ai-assistant/application/query/getAgentToolsByUserId/getAgentToolsByUserIdQuery';
import { GetAgentToolsByUserIdHandler } from '@contexts/ai-assistant/application/query/getAgentToolsByUserId/getAgentToolsByUserIdHandler';
import { GetAllAgentToolsQuery } from '@contexts/ai-assistant/application/query/getAllAgentTools/getAllAgentToolsQuery';
import { GetAllAgentToolsHandler } from '@contexts/ai-assistant/application/query/getAllAgentTools/getAllAgentToolsHandler';
import { RevokeAgentToolCommand } from '@contexts/ai-assistant/application/command/revokeAgentTool/revokeAgentToolCommand';
import { RevokeAgentToolHandler } from '@contexts/ai-assistant/application/command/revokeAgentTool/revokeAgentToolHandler';
import { RestoreAgentToolCommand } from '@contexts/ai-assistant/application/command/restoreAgentTool/restoreAgentToolCommand';
import { RestoreAgentToolHandler } from '@contexts/ai-assistant/application/command/restoreAgentTool/restoreAgentToolHandler';

import { ToolRegistry } from '@contexts/ai-assistant/application/tool/toolRegistry';
import { createToolRegistry } from '@contexts/ai-assistant/application/tool/catalog';
import { AgentAuthenticator } from '@contexts/ai-assistant/application/auth/agentAuthenticator';

// --- CV ---
import { CvFactory } from '@contexts/cv/domain/factory/cvFactory';
import { CreateCvCommand } from '@contexts/cv/application/command/createCv/createCvCommand';
import { CreateCvHandler } from '@contexts/cv/application/command/createCv/createCvHandler';
import { DeleteCvCommand } from '@contexts/cv/application/command/deleteCv/deleteCvCommand';
import { DeleteCvHandler } from '@contexts/cv/application/command/deleteCv/deleteCvHandler';
import { SetCvVisibilityCommand } from '@contexts/cv/application/command/setCvVisibility/setCvVisibilityCommand';
import { SetCvVisibilityHandler } from '@contexts/cv/application/command/setCvVisibility/setCvVisibilityHandler';
import { ReorderCvsCommand } from '@contexts/cv/application/command/reorderCvs/reorderCvsCommand';
import { ReorderCvsHandler } from '@contexts/cv/application/command/reorderCvs/reorderCvsHandler';
import { ListCvsQuery } from '@contexts/cv/application/query/listCvs/listCvsQuery';
import { ListCvsHandler } from '@contexts/cv/application/query/listCvs/listCvsHandler';

import { EntityManager } from '@mikro-orm/postgresql';
import { PostgresOwnerNumberSequence } from '@shared/infrastructure/sequence/postgresOwnerNumberSequence';
import { UserRepository } from '@contexts/user/infrastructure/repository/userRepository';
import { PortfolioRepository } from '@contexts/portfolio/infrastructure/repository/portfolioRepository';
import { ProjectRepository } from '@contexts/project/infrastructure/repository/projectRepository';
import { FeatureRepository } from '@contexts/feature/infrastructure/repository/featureRepository';
import { TicketRepository } from '@contexts/ticket/infrastructure/repository/ticketRepository';
import { IdeaRepository } from '@contexts/idea/infrastructure/repository/ideaRepository';
import { PageLayoutRepository } from '@contexts/contentEditor/infrastructure/repository/pageLayoutRepository';
import { AgentToolRepository } from '@contexts/ai-assistant/infrastructure/repository/agentToolRepository';
import { UploadStorage } from '@shared/infrastructure/upload/uploadStorage';
import { ContactMessageRepository } from '@contexts/contact/infrastructure/repository/contactMessageRepository';
import { CvRepository } from '@contexts/cv/infrastructure/repository/cvRepository';
import { createMailer } from '@contexts/contact/infrastructure/mailer/createMailer';
import { ILogger } from '@shared/application/port/iLogger';
import { SubmitContactMessageCommand } from '@contexts/contact/application/command/submitContactMessage/submitContactMessageCommand';
import { SubmitContactMessageHandler } from '@contexts/contact/application/command/submitContactMessage/submitContactMessageHandler';
import { DeleteContactMessageCommand } from '@contexts/contact/application/command/deleteContactMessage/deleteContactMessageCommand';
import { DeleteContactMessageHandler } from '@contexts/contact/application/command/deleteContactMessage/deleteContactMessageHandler';
import { DeleteAllContactMessagesCommand } from '@contexts/contact/application/command/deleteAllContactMessages/deleteAllContactMessagesCommand';
import { DeleteAllContactMessagesHandler } from '@contexts/contact/application/command/deleteAllContactMessages/deleteAllContactMessagesHandler';
import { ListContactMessagesQuery } from '@contexts/contact/application/query/listContactMessages/listContactMessagesQuery';
import { ListContactMessagesHandler } from '@contexts/contact/application/query/listContactMessages/listContactMessagesHandler';

export function bootstrap(
    em: EntityManager,
    logger: ILogger,
): {
    commandBus: CommandBus;
    queryBus: QueryBus;
    toolRegistry: ToolRegistry;
    agentAuthenticator: AgentAuthenticator;
} {
    const repos = {
        user: new UserRepository(em),
        portfolio: new PortfolioRepository(em),
        project: new ProjectRepository(em),
        feature: new FeatureRepository(em),
        ticket: new TicketRepository(em),
        idea: new IdeaRepository(em),
        pageLayout: new PageLayoutRepository(em),
        agentTool: new AgentToolRepository(em),
        contactMessage: new ContactMessageRepository(em),
        cv: new CvRepository(em),
    };
    const commandBus = new CommandBus();
    const queryBus = new QueryBus();

    // Les fichiers uploadés n'appartiennent à aucun agrégat : plusieurs peuvent citer le même.
    // Le stockage compte les références restantes avant de supprimer quoi que ce soit.
    const uploads = new UploadStorage(em);

    // Un seul exécutant de transaction pour tous les cas d'usage multi-dépôts.
    const transactions = new MikroOrmTransactionRunner(em);

    // Séquence partagée par les projets et les idées : c'est elle qui rend la conversion
    // transparente pour les références de tickets.
    const ownerNumbers = new PostgresOwnerNumberSequence(em);

    // Seul point de contact entre le contexte Feature et ses porteurs : il pose les questions,
    // Project et Idea répondent chacun pour eux-mêmes.
    const ownerGateway = new OwnerGateway(repos.project, repos.idea);

    // Le contexte Ticket interroge le contexte Feature par son contrat public — la query — et
    // c'est Feature qui remonte jusqu'au porteur. Ticket ne connaît ni Project ni Idea.
    const featureGateway = new FeatureGateway(queryBus);

    // Cascades : chaque contexte annonce sa disparition au suivant, personne ne supprime chez
    // le voisin. Feature -> Ticket, puis Idea -> Feature.
    const featureTicketsGateway = new FeatureTicketsGateway(repos.ticket);
    const ideaFeaturesGateway = new IdeaFeaturesGateway(repos.feature, featureTicketsGateway);
    const projectCreationGateway = new ProjectCreationGateway(commandBus);

    // Lecture transverse : traduit une référence lisible en entités.
    const referenceDirectory = new ReferenceDirectory(repos.project, repos.idea, repos.feature, repos.ticket);

    const userFactory = new UserFactory();
    const portfolioFactory = new PortfolioFactory();
    const projectFactory = new ProjectFactory();
    const featureFactory = new FeatureFactory();
    const ticketFactory = new TicketFactory();
    const ideaFactory = new IdeaFactory();
    const pageLayoutFactory = new PageLayoutFactory();
    const agentToolFactory = new AgentToolFactory();
    const cvFactory = new CvFactory();

    // User
    commandBus.register(CreateUserCommand.commandName, new CreateUserHandler(repos.user, userFactory));
    commandBus.register(
        DeleteUserCommand.commandName,
        new DeleteUserHandler(repos.user, [new RevokeAgentToolsOnUserDeleted(repos.agentTool)]),
    );
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

    // Project
    commandBus.register(
        CreateProjectCommand.commandName,
        new CreateProjectHandler(repos.project, projectFactory, ownerNumbers),
    );
    commandBus.register(AddProjectDocumentCommand.commandName, new AddProjectDocumentHandler(repos.project));
    commandBus.register(
        RemoveProjectDocumentCommand.commandName,
        new RemoveProjectDocumentHandler(repos.project, uploads),
    );
    commandBus.register(AddProjectLinkCommand.commandName, new AddProjectLinkHandler(repos.project));
    commandBus.register(RemoveProjectLinkCommand.commandName, new RemoveProjectLinkHandler(repos.project));
    queryBus.register(GetProjectByIdQuery.queryName, new GetProjectByIdHandler(repos.project));
    queryBus.register(ListProjectsQuery.queryName, new ListProjectsHandler(repos.project));
    commandBus.register(UpdateProjectCommand.commandName, new UpdateProjectHandler(repos.project));
    commandBus.register(UpdateProjectVisibilityCommand.commandName, new UpdateProjectVisibilityHandler(repos.project));

    // Feature
    commandBus.register(
        CreateFeatureCommand.commandName,
        new CreateFeatureHandler(repos.feature, featureFactory, ownerGateway),
    );
    commandBus.register(AddFeatureDocumentCommand.commandName, new AddFeatureDocumentHandler(repos.feature));
    commandBus.register(
        RemoveFeatureDocumentCommand.commandName,
        new RemoveFeatureDocumentHandler(repos.feature, uploads),
    );
    queryBus.register(GetFeatureByIdQuery.queryName, new GetFeatureByIdHandler(repos.feature, ownerGateway));
    queryBus.register(GetFeaturesByOwnerQuery.queryName, new GetFeaturesByOwnerHandler(repos.feature, ownerGateway));
    commandBus.register(UpdateFeatureCommand.commandName, new UpdateFeatureHandler(repos.feature));
    commandBus.register(
        DeleteFeatureCommand.commandName,
        new DeleteFeatureHandler(repos.feature, featureTicketsGateway, uploads),
    );

    // Ticket
    commandBus.register(
        CreateTicketCommand.commandName,
        new CreateTicketHandler(repos.ticket, ticketFactory, featureGateway),
    );
    commandBus.register(
        ChangeTicketStatusCommand.commandName,
        new ChangeTicketStatusHandler(repos.ticket, featureGateway),
    );
    commandBus.register(UpdateTicketCommand.commandName, new UpdateTicketHandler(repos.ticket));
    commandBus.register(UpdateTicketNoteCommand.commandName, new UpdateTicketNoteHandler(repos.ticket));
    commandBus.register(DeleteTicketCommand.commandName, new DeleteTicketHandler(repos.ticket, uploads));
    commandBus.register(AddTicketNoteCommand.commandName, new AddTicketNoteHandler(repos.ticket));
    commandBus.register(AddTicketDocumentCommand.commandName, new AddTicketDocumentHandler(repos.ticket));
    commandBus.register(
        RemoveTicketDocumentCommand.commandName,
        new RemoveTicketDocumentHandler(repos.ticket, uploads),
    );
    queryBus.register(GetTicketByIdQuery.queryName, new GetTicketByIdHandler(repos.ticket, featureGateway));
    queryBus.register(
        GetTicketsByFeatureIdQuery.queryName,
        new GetTicketsByFeatureIdHandler(repos.ticket, featureGateway),
    );

    // Idea
    commandBus.register(CreateIdeaCommand.commandName, new CreateIdeaHandler(repos.idea, ideaFactory, ownerNumbers));
    commandBus.register(UpdateIdeaCommand.commandName, new UpdateIdeaHandler(repos.idea));
    commandBus.register(DeleteIdeaCommand.commandName, new DeleteIdeaHandler(repos.idea, ideaFeaturesGateway, uploads));
    commandBus.register(AddIdeaDocumentCommand.commandName, new AddIdeaDocumentHandler(repos.idea));
    commandBus.register(RemoveIdeaDocumentCommand.commandName, new RemoveIdeaDocumentHandler(repos.idea, uploads));
    commandBus.register(AddIdeaLinkCommand.commandName, new AddIdeaLinkHandler(repos.idea));
    commandBus.register(RemoveIdeaLinkCommand.commandName, new RemoveIdeaLinkHandler(repos.idea));
    queryBus.register(GetIdeaByIdQuery.queryName, new GetIdeaByIdHandler(repos.idea));
    queryBus.register(ListIdeasQuery.queryName, new ListIdeasHandler(repos.idea));
    commandBus.register(
        ConvertIdeaToProjectCommand.commandName,
        new ConvertIdeaToProjectHandler(repos.idea, ideaFeaturesGateway, projectCreationGateway, transactions),
    );

    // Reference (lecture transverse)
    queryBus.register(ResolveReferenceQuery.queryName, new ResolveReferenceHandler(referenceDirectory));
    queryBus.register(GetReferenceTreeQuery.queryName, new GetReferenceTreeHandler(referenceDirectory));

    // ContentEditor
    commandBus.register(
        CreatePageLayoutCommand.commandName,
        new CreatePageLayoutHandler(repos.pageLayout, pageLayoutFactory),
    );
    commandBus.register(AddSectionCommand.commandName, new AddSectionHandler(repos.pageLayout));
    commandBus.register(RemoveSectionCommand.commandName, new RemoveSectionHandler(repos.pageLayout, uploads));
    commandBus.register(MoveSectionCommand.commandName, new MoveSectionHandler(repos.pageLayout));
    commandBus.register(UpdateSectionContentCommand.commandName, new UpdateSectionContentHandler(repos.pageLayout));
    queryBus.register(GetPageLayoutByIdQuery.queryName, new GetPageLayoutByIdHandler(repos.pageLayout));
    queryBus.register(GetPageLayoutByRefQuery.queryName, new GetPageLayoutByRefHandler(repos.pageLayout));
    queryBus.register(
        ListMediaImagesQuery.queryName,
        new ListMediaImagesHandler(repos.project, repos.feature, repos.ticket),
    );

    // AI Assistant
    commandBus.register(
        CreateAgentToolCommand.commandName,
        new CreateAgentToolHandler(repos.agentTool, agentToolFactory),
    );
    commandBus.register(UpdateAgentToolNameCommand.commandName, new UpdateAgentToolNameHandler(repos.agentTool));
    commandBus.register(
        UpdateAgentToolPermissionCommand.commandName,
        new UpdateAgentToolPermissionHandler(repos.agentTool),
    );
    commandBus.register(AddAgentToolScopeCommand.commandName, new AddAgentToolScopeHandler(repos.agentTool));
    commandBus.register(RemoveAgentToolScopeCommand.commandName, new RemoveAgentToolScopeHandler(repos.agentTool));
    commandBus.register(RotateAgentToolTokenCommand.commandName, new RotateAgentToolTokenHandler(repos.agentTool));
    queryBus.register(GetAgentToolByIdQuery.queryName, new GetAgentToolByIdHandler(repos.agentTool));
    queryBus.register(GetAgentToolsByUserIdQuery.queryName, new GetAgentToolsByUserIdHandler(repos.agentTool));
    queryBus.register(GetAllAgentToolsQuery.queryName, new GetAllAgentToolsHandler(repos.agentTool));
    commandBus.register(RevokeAgentToolCommand.commandName, new RevokeAgentToolHandler(repos.agentTool));
    commandBus.register(RestoreAgentToolCommand.commandName, new RestoreAgentToolHandler(repos.agentTool));

    // Contact
    // The owner's inbox lives in the environment only: it must never reach the public API.
    commandBus.register(
        SubmitContactMessageCommand.commandName,
        new SubmitContactMessageHandler(
            repos.contactMessage,
            createMailer(logger),
            env.CONTACT_MAIL_TO || null,
            logger,
        ),
    );
    commandBus.register(DeleteContactMessageCommand.commandName, new DeleteContactMessageHandler(repos.contactMessage));
    commandBus.register(
        DeleteAllContactMessagesCommand.commandName,
        new DeleteAllContactMessagesHandler(repos.contactMessage),
    );
    queryBus.register(ListContactMessagesQuery.queryName, new ListContactMessagesHandler(repos.contactMessage));

    // CV
    commandBus.register(CreateCvCommand.commandName, new CreateCvHandler(repos.cv, cvFactory));
    commandBus.register(DeleteCvCommand.commandName, new DeleteCvHandler(repos.cv, uploads));
    commandBus.register(SetCvVisibilityCommand.commandName, new SetCvVisibilityHandler(repos.cv));
    commandBus.register(ReorderCvsCommand.commandName, new ReorderCvsHandler(repos.cv));
    queryBus.register(ListCvsQuery.queryName, new ListCvsHandler(repos.cv));

    // Tools reuse the very same buses as the REST API: one implementation, two audiences.
    const toolRegistry = createToolRegistry(commandBus, queryBus, logger);
    const agentAuthenticator = new AgentAuthenticator(repos.agentTool);

    return { commandBus, queryBus, toolRegistry, agentAuthenticator };
}
