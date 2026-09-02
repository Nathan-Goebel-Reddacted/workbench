import { Id } from '@shared/domain/id';

export class TicketId extends Id {
    constructor(value?: string) {
        super(value);
    }
}
