import { DomainException } from '@shared/domain/domainException';

export class LastEditorCannotBeRemovedException extends DomainException {
    constructor() {
        super(
            'The last account holding the edit role cannot lose it: the application would become permanently read-only',
        );
    }
}
