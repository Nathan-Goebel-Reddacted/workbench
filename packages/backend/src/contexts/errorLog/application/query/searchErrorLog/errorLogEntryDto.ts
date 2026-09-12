export type ErrorLogEntryDto = Readonly<{
    id: string;
    origin: string;
    message: string;
    stack: string | null;
    url: string | null;
    userId: string | null;
    correlationId: string | null;
    context: Readonly<Record<string, unknown>>;
    occurredAt: string;
}>;

export type ErrorLogPageDto = Readonly<{
    entries: ErrorLogEntryDto[];
    total: number;
    limit: number;
    offset: number;
}>;
