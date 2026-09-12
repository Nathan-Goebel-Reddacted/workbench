import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { ProvisionOutcome, ProvisionUserFromOAuthCommand } from './provisionUserFromOAuthCommand';
import { IAllowedEmailRepository } from '../../../domain/repository/iAllowedEmailRepository';
import { AccessPolicy } from '../../../domain/policy/accessPolicy';
import { AuthEmail } from '../../../domain/valueObject/email';
import { RecordAccessRequestCommand } from '../recordAccessRequest/recordAccessRequestCommand';
import { AccessRequestStatus } from '../../../domain/valueObject/accessRequestStatus';
import { CreateUserCommand } from '@contexts/user/application/command/createUser/createUserCommand';
import { GetUserByEmailQuery } from '@contexts/user/application/query/getUserByEmail/getUserByEmailQuery';
import { UserDto } from '@contexts/user/application/query/getUserById/userDto';
import { UserAlreadyExistsException } from '@contexts/user/application/command/createUser/createUserCommand';
import { randomUUID } from 'node:crypto';

/**
 * Tout ce qui se décide quand quelqu'un revient d'un fournisseur OAuth.
 *
 * Ce code vivait dans `authRoutes`, mêlé aux appels réseau et à la pose du cookie. Il en est
 * sorti entier : la route ne fait plus qu'échanger le code contre un profil, appeler ceci, et
 * signer ce qu'on lui rend.
 *
 * Le contexte User reste seul maître de ses comptes — on lui parle par ses commandes et ses
 * requêtes, jamais par son dépôt.
 */
export class ProvisionUserFromOAuthHandler implements ICommandHandler<ProvisionUserFromOAuthCommand, ProvisionOutcome> {
    constructor(
        private readonly allowed: IAllowedEmailRepository,
        private readonly policy: AccessPolicy,
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    async handle(command: ProvisionUserFromOAuthCommand): Promise<ProvisionOutcome> {
        const email = new AuthEmail(command.email);

        if (!(await this.allowed.contains(email))) {
            const status = await this.commandBus.dispatch<RecordAccessRequestCommand, AccessRequestStatus>(
                new RecordAccessRequestCommand(email.getValue(), `${command.name} ${command.surname}`),
            );
            return { kind: 'accessRequested', status };
        }

        const existing = await this.findUser(email);
        if (existing) return { kind: 'session', user: this.toProvisioned(existing, email) };

        await this.createAccount(command, email);

        const created = await this.findUser(email);
        // Le compte vient d'être créé — ou l'était déjà par un appel concurrent. Son absence
        // ici signifie que l'écriture n'a pas pris, et ouvrir une session sans compte derrière
        // serait pire que refuser.
        if (!created) throw new Error(`User provisioning failed for ${email.getValue()}`);

        return { kind: 'session', user: this.toProvisioned(created, email) };
    }

    private async createAccount(command: ProvisionUserFromOAuthCommand, email: AuthEmail): Promise<void> {
        const roles = this.policy.rolesForNewAccount(email);
        try {
            await this.commandBus.dispatch(
                new CreateUserCommand(randomUUID(), command.name, command.surname, email.getValue(), roles),
            );
        } catch (error) {
            // Deux onglets, deux callbacks simultanés : le second se heurte à l'unicité de
            // l'adresse. Le compte existe, c'est tout ce qui comptait — on le relit plus bas.
            if (!(error instanceof UserAlreadyExistsException)) throw error;
        }
    }

    private async findUser(email: AuthEmail): Promise<UserDto | null> {
        return this.queryBus.dispatch<GetUserByEmailQuery, UserDto | null>(new GetUserByEmailQuery(email.getValue()));
    }

    private toProvisioned(user: UserDto, email: AuthEmail) {
        return { id: user.id, email: email.getValue(), roles: user.roles, tokenVersion: user.tokenVersion };
    }
}
