export type UserDto = Readonly<{
    id: string;
    name: string;
    surname: string;
    email: string;
    roles: string[];
    /** Version de session courante : un jeton signé sous une version antérieure est refusé. */
    tokenVersion: number;
}>;
