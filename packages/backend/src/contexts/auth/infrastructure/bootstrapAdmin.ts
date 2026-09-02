import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { GetUserByEmailQuery } from '@contexts/user/application/query/getUserByEmail/getUserByEmailQuery.js';
import { UpdateUserRolesCommand } from '@contexts/user/application/command/updateUserRoles/updateUserRolesCommand.js';
import { UserDto } from '@contexts/user/application/query/getUserById/userDto.js';
import { UserRole } from '@contexts/user/domain/valueObject/role.js';
import { AllowedEmailRepository } from './repository/allowedEmailRepository.js';
import { env } from '@shared/infrastructure/config/env.js';

export function bootstrapAdminEmail(): string | null {
    return env.BOOTSTRAP_ADMIN_EMAIL ? env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase() : null;
}

type Deps = {
    em: EntityManager;
    commandBus: CommandBus;
    queryBus: QueryBus;
    allowedEmailRepo: AllowedEmailRepository;
    log: (message: string) => void;
};

// Sur une base vierge la whitelist est vide, donc aucune connexion OAuth n'aboutit, et
// personne ne peut y ajouter d'adresse puisque la route exige déjà le rôle 'edit'.
// Cette amorce est la seule porte d'entrée ; elle est idempotente et ne retire jamais rien.
export async function bootstrapAdmin({ em, commandBus, queryBus, allowedEmailRepo, log }: Deps): Promise<void> {
    const email = bootstrapAdminEmail();
    if (!email) return;

    await RequestContext.create(em, async () => {
        // exists() plutôt que le catch de add() : sur violation d'unicité, l'entité refusée
        // reste dans l'unit of work et le flush suivant (l'octroi de rôle, plus bas) rejoue
        // l'insert et lève l'exception brute. Une requête HTTP ne le voit pas, son contexte
        // EM mourant juste après le catch.
        if (!(await allowedEmailRepo.exists(email))) {
            await allowedEmailRepo.add(email);
            log(`BOOTSTRAP_ADMIN_EMAIL: ${email} ajouté à la whitelist`);
        }

        const user = await queryBus.dispatch<GetUserByEmailQuery, UserDto | null>(new GetUserByEmailQuery(email));
        // Pas encore de compte : il sera provisionné à la première connexion, avec le rôle
        // que handleOAuthSuccess accorde à cette même adresse.
        if (!user) return;
        if (user.roles.includes(UserRole.EDIT)) return;

        await commandBus.dispatch(new UpdateUserRolesCommand(user.id, [...user.roles, UserRole.EDIT]));
        log(`BOOTSTRAP_ADMIN_EMAIL: rôle '${UserRole.EDIT}' accordé à ${email}`);
    });
}
