export type AccessRequestDto = Readonly<{
    email: string;
    displayName: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}>;
