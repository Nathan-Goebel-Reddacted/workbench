import { InvalidPermissionException } from '../exception/invalidPermission';

export enum PermissionValue {
    READ = 'read',
    WRITE = 'write',
    READ_WRITE = 'read_write',
}

const VALID_PERMISSIONS = Object.values(PermissionValue);

export class Permission {
    private readonly value: PermissionValue;

    constructor(value: string) {
        if (!VALID_PERMISSIONS.includes(value as PermissionValue)) {
            throw new InvalidPermissionException(value);
        }
        this.value = value as PermissionValue;
    }

    getValue(): PermissionValue {
        return this.value;
    }

    canRead(): boolean {
        return this.value === PermissionValue.READ || this.value === PermissionValue.READ_WRITE;
    }

    canWrite(): boolean {
        return this.value === PermissionValue.WRITE || this.value === PermissionValue.READ_WRITE;
    }
}
