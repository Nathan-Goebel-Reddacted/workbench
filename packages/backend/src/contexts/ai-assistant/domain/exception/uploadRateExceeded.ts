import { DomainException } from '@shared/domain/domainException';

export class UploadRateExceededException extends DomainException {
    constructor(max: number, minutes: number) {
        super(`Too many uploads: at most ${max} every ${minutes} minutes. Try again later.`);
    }
}
