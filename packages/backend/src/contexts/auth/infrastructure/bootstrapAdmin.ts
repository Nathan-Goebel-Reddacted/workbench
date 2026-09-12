import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { GetUserByEmailQuery } from '@contexts/user/application/query/getUserByEmail/getUserByEmailQuery.js';
import { UpdateUserRolesCommand } from '@contexts/user/application/command/updateUserRoles/updateUserRolesCommand.js';
import { UserDto } from '@contexts/user/application/query/getUserById/userDto.js';
import { UserRole } from '@shared/domain/valueObject/userRole.js';
import { AddAllowedEmailCommand } from '../application/command/addAllowedEmail/addAllowedEmailCommand.js';
import { EmailAlreadyAllowedException } from '../domain/exception/emailAlreadyAllowed.js';
import { AuthEmail } from '../domain/valueObject/email.js';
import { env } from '@shared/infrastructure/config/env.js';

/** L'adresse d'amorçage telle que le déploiement la déclare, ou `null` si aucune ne l'est. */
export function bootstrapAdminEmail(): AuthEmail | null {
    if (!env.BOOTSTRAP_ADMIN_EMAIL) return null;
    try {
        return new AuthEmail(env.BOOTSTRAP_ADMIN_EMAIL);
    } catch {
        // Une adresse d'amorçage illisible ne doit pas empêcher l'application de démarrer :
        // elle rend seulement l'amorçage inopérant, ce que le journal signale au démarrage.
        return null;
    }
}

type Deps = {
    em: EntityManager;
    commandBus: CommandBus;
    queryBus: QueryBus;
    log: (message: string) => void;
};

// Sur une base vierge la liste blanche est vide, donc aucune connexion OAuth n'aboutit, et
// personne ne peut y ajouter d'adresse puisque la route exige déjà le rôle 'edit'.
// Cette amorce est la seule porte d'entrée ; elle est idempotente et ne retire jamais rien.
export async function bootstrapAdmin({ em, commandBus, queryBus, log }: Deps): Promise<void> {
    const admin = bootstrapAdminEmail();
    if (!admin) return;
    const email = admin.getValue();

    await RequestContext.create(em, async () => {
        try {
            await commandBus.dispatch(new AddAllowedEmailCommand(email));
            log(`BOOTSTRAP_ADMIN_EMAIL: ${email} ajouté à la whitelist`);
        } catch (error) {
            // Déjà présente : c'est le cas normal à partir du deuxième démarrage.
            if (!(error instanceof EmailAlreadyAllowedException)) throw error;
        }

        const user = await queryBus.dispatch<GetUserByEmailQuery, UserDto | null>(new GetUserByEmailQuery(email));
        // Pas encore de compte : il sera provisionné à la première connexion, avec le rôle
        // que la politique d'accès accorde à cette même adresse.
        if (!user) return;
        if (user.roles.includes(UserRole.EDIT)) return;

        await commandBus.dispatch(new UpdateUserRolesCommand(user.id, [...user.roles, UserRole.EDIT]));
        log(`BOOTSTRAP_ADMIN_EMAIL: rôle '${UserRole.EDIT}' accordé à ${email}`);
    });
}
