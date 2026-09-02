import { Id } from '@shared/domain/id';

export class ProjectId extends Id {
    constructor(value?: string) {
        super(value);
    }
}
