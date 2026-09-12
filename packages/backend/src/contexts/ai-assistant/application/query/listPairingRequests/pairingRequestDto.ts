import { PairingRequest } from '../../../domain/pairingRequestAggregate';

/** Ce que l'écran d'administration a le droit de voir : le préfixe identifie la demande, le code entier ne sort jamais. */
export type PairingRequestDto = Readonly<{
    id: string;
    name: string;
    requestedScopes: string[];
    requestedPermission: string;
    codePrefix: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
}>;

export function toPairingRequestDto(request: PairingRequest): PairingRequestDto {
    return {
        id: request.getId().getValue(),
        name: request.getName().getValue(),
        requestedScopes: request.getRequestedScopes().map(scope => scope.getValue()),
        requestedPermission: request.getRequestedPermission().getValue(),
        codePrefix: request.getCode().getPrefix(),
        status: request.getStatus(),
        expiresAt: request.getExpiresAt(),
        createdAt: request.getCreatedAt(),
    };
}
