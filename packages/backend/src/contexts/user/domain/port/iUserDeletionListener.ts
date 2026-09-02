// Ce qu'un autre contexte doit défaire quand un compte disparaît. Le contexte user ne
// connaît ni les agents ni ce qui viendra ensuite : il annonce seulement la suppression.
export interface IUserDeletionListener {
    onUserDeleted(userId: string): Promise<void>;
}
