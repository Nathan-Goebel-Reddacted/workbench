export type UserDto = Readonly<{
    id: string;
    name: string;
    surname: string;
    email: string;
    roles: string[];
}>;
