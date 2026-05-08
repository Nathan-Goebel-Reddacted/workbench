import { InvalidScopeException } from "../exception/invalidScope";

export enum ScopeValue {
    PROJECT = "project",
    FEATURE = "feature",
    TICKET = "ticket",
    IDEA = "idea",
    PORTFOLIO = "portfolio",
}

const VALID_SCOPES = Object.values(ScopeValue);

export class Scope {
    private readonly value: ScopeValue;

    constructor(value: string) {
        if (!VALID_SCOPES.includes(value as ScopeValue)) {
            throw new InvalidScopeException(value);
        }
        this.value = value as ScopeValue;
    }

    getValue(): ScopeValue {
        return this.value;
    }

    equals(other: Scope): boolean {
        return this.value === other.value;
    }
}
