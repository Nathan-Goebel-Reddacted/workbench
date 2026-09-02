import { Id } from '@shared/domain/id';

export class FeatureId extends Id {
    constructor(value?: string) {
        super(value);
    }
}
