import { PairingRequest, PAIRING_TTL_MS } from '../pairingRequestAggregate';
import { PairingRequestId } from '../valueObject/pairingRequestId';
import { Name } from '../valueObject/name';
import { Permission } from '../valueObject/permission';
import { Scope } from '../valueObject/scope';
import { PairingCode } from '../valueObject/pairingCode';
import { ISecretHasher } from '../port/iSecretHasher';

export class PairingRequestFactory {
    constructor(private readonly hasher: ISecretHasher) {}

    async create(
        name: string,
        scopes: string[],
        permission: string,
        rawCode: string,
        now: Date = new Date(),
    ): Promise<PairingRequest> {
        const code = new PairingCode(await this.hasher.hash(rawCode), PairingCode.prefixOf(rawCode));
        return new PairingRequest(
            new PairingRequestId(),
            new Name(name),
            scopes.map(scope => new Scope(scope)),
            new Permission(permission),
            code,
            new Date(now.getTime() + PAIRING_TTL_MS),
            undefined,
            now,
        );
    }
}
